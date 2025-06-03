import anyTest, {TestFn} from "ava";
import {createVirtualLanguageServiceHost} from "../../../../src/linter/ui5Types/host.js";
import LinterContext from "../../../../src/linter/LinterContext.js";
import SharedLanguageService from "../../../../src/linter/ui5Types/SharedLanguageService.js";
import ts from "typescript";
import {getSymbolForPropertyInConstructSignatures} from "../../../../src/linter/ui5Types/utils/utils.js";
import {getUi5TypeInfoFromSymbol, Ui5TypeInfo, Ui5TypeInfoKind} from "../../../../src/linter/ui5Types/Ui5TypeInfo.js";
import {ApiExtract, loadApiExtract} from "../../../../src/utils/ApiExtract.js";

class TestContext {
	constructor(
		public program: ts.Program,
		public checker: ts.TypeChecker,
		public sourceFile: ts.SourceFile
	) {}

	getFirstStatement(): ts.Statement {
		const firstStatement = this.sourceFile.statements[0];
		if (firstStatement) {
			return firstStatement;
		}
		throw new Error("No statements found in the source file.");
	}

	getFirstExpressionStatement(): ts.ExpressionStatement {
		const firstStatement = this.sourceFile.statements.find(
			(statement): statement is ts.ExpressionStatement => ts.isExpressionStatement(statement)
		);
		if (firstStatement && ts.isExpressionStatement(firstStatement)) {
			return firstStatement;
		}
		throw new Error("No ExpressionStatement found in the source file.");
	}

	getFirstNewExpression(): ts.NewExpression {
		const expression = this.getFirstExpressionStatement().expression;
		if (ts.isNewExpression(expression)) {
			return expression;
		}
		throw new Error("No NewExpression found in the source file.");
	}

	getFirstCallExpression(): ts.CallExpression {
		const expression = this.getFirstExpressionStatement().expression;
		if (ts.isCallExpression(expression)) {
			return expression;
		}
		throw new Error("No CallExpression found in the source file.");
	}

	getFirstPropertyAccessExpression(): ts.PropertyAccessExpression {
		const expression = this.getFirstExpressionStatement().expression;
		if (ts.isPropertyAccessExpression(expression)) {
			return expression;
		}
		throw new Error("No PropertyAccessExpression found in the source file.");
	}

	getConstructorPropertyAssignmentSymbol(
		newExpression: ts.NewExpression, propertyName: string
	): ts.Symbol | undefined {
		const classType = this.checker.getTypeAtLocation(newExpression.expression);
		const objectLiteralExpression = newExpression.arguments?.[0] as ts.ObjectLiteralExpression;
		const propertyAssignment = objectLiteralExpression.properties.find(
			(prop) => ts.isPropertyAssignment(prop) && prop.name.getText() === propertyName
		) as ts.PropertyAssignment | undefined;

		if (propertyAssignment) {
			return getSymbolForPropertyInConstructSignatures(
				classType.getConstructSignatures(), 0, propertyName
			);
		}
		return undefined;
	}
}

const test = anyTest as TestFn<{
	sharedLanguageService: SharedLanguageService;
	apiExtract: ApiExtract;
	initTestContext: (sourceFileContent: string, options?: InitTestContextOptions) => Promise<TestContext>;
}>;

// Note: Tests in this file are serial because they use a shared language service instance.

interface InitTestContextOptions {
	ts?: boolean; // If true, the source file is treated as TypeScript
}

test.before(async (t) => {
	t.context.sharedLanguageService = new SharedLanguageService();
	t.context.apiExtract = await loadApiExtract();
	t.context.initTestContext = async (sourceFileContent: string, options?: InitTestContextOptions) => {
		const sharedLanguageService = t.context.sharedLanguageService;

		const extension = options?.ts ? ".ts" : ".js";
		const fileName = `/resources/test/test${extension}`;
		const fileContents = new Map<string, string>([
			[fileName, sourceFileContent],
		]);
		const sourceMaps = new Map<string, string>();
		const context = new LinterContext({
			rootDir: "/",
			namespace: "test",
		});
		const projectScriptVersion = sharedLanguageService.getNextProjectScriptVersion();

		const host = await createVirtualLanguageServiceHost(
			{}, fileContents, sourceMaps, context, projectScriptVersion, undefined
		);

		sharedLanguageService.acquire(host);

		const program = sharedLanguageService.getProgram();
		const checker = program.getTypeChecker();
		const sourceFile = program.getSourceFile(fileName)!;

		return new TestContext(program, checker, sourceFile);
	};
});

test.afterEach.always((t) => {
	// Ensure to always release the shared language service after each test
	// so that the next test can acquire it again.
	t.context.sharedLanguageService.release();
});

test.serial("TypeInfo: Symbol without valueDeclaration", async (t) => {
	const testContext = await t.context.initTestContext(`
		interface MyInterface {}
	`, {ts: true});

	const interfaceDeclaration = testContext.getFirstStatement() as ts.InterfaceDeclaration;

	// A symbol from an interface identifier does not have a valueDeclaration.
	const symbol = testContext.checker.getSymbolAtLocation(interfaceDeclaration.name)!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		symbol, t.context.apiExtract
	);
	t.is(ui5TypeInfo, undefined);
});

test.serial("TypeInfo: sap/m/Button 'text' property", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/m/Button"], function(Button) {
			new Button({
				text: function() {}
			});
		});`
	);

	const newExpression = testContext.getFirstNewExpression();
	const propertySymbol = testContext.getConstructorPropertyAssignmentSymbol(newExpression, "text")!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		propertySymbol, t.context.apiExtract
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataProperty,
		name: "text",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.m",
				name: "sap/m/Button",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/m/Button 'ariaDescribedBy' association", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/m/Button"], function(Button) {
			new Button({
				ariaDescribedBy: ["describedBy"]
			});
		});`
	);

	const newExpression = testContext.getFirstNewExpression();
	const propertySymbol = testContext.getConstructorPropertyAssignmentSymbol(newExpression, "ariaDescribedBy")!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		propertySymbol, t.context.apiExtract
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataAssociation,
		name: "ariaDescribedBy",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.m",
				name: "sap/m/Button",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/m/Button 'tap' event", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/m/Button"], function(Button) {
			new Button({
				tap: function() {}
			});
		});`
	);

	const newExpression = testContext.getFirstNewExpression();
	const propertySymbol = testContext.getConstructorPropertyAssignmentSymbol(newExpression, "tap")!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		propertySymbol, t.context.apiExtract
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataEvent,
		name: "tap",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ButtonSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.m",
				name: "sap/m/Button",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/ui/table/Table 'rows' aggregation", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/table/Table"], function(Table) {
			new Table({
				rows: []
			});
		});`
	);

	const newExpression = testContext.getFirstNewExpression();
	const propertySymbol = testContext.getConstructorPropertyAssignmentSymbol(newExpression, "rows")!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		propertySymbol, t.context.apiExtract
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataAggregation,
		name: "rows",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$TableSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.ui.table",
				name: "sap/ui/table/Table",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/m/Table 'columns' aggregation", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/m/Table"], function(Table) {
			new Table({
				columns: []
			});
		});`
	);

	const newExpression = testContext.getFirstNewExpression();
	const propertySymbol = testContext.getConstructorPropertyAssignmentSymbol(newExpression, "columns")!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		propertySymbol, t.context.apiExtract
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataAggregation,
		name: "columns",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$TableSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.m",
				name: "sap/m/Table",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/m/Table 'items' aggregation", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/m/Table"], function(Table) {
			new Table({
				items: []
			});
		});`
	);

	const newExpression = testContext.getFirstNewExpression();
	const propertySymbol = testContext.getConstructorPropertyAssignmentSymbol(newExpression, "items")!;

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(
		propertySymbol, t.context.apiExtract
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataAggregation,
		name: "items",
		parent: {
			kind: Ui5TypeInfoKind.ManagedObjectSettings,
			name: "$ListBaseSettings",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.m",
				name: "sap/m/ListBase",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/ui/core/Core 'byId' method", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/Core"], function(Core) {
			Core.byId("test");
		});`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getSymbolAtLocation(callExpression.expression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Method,
		name: "byId",
		parent: {
			kind: Ui5TypeInfoKind.Class,
			name: "Core",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.ui.core",
				name: "sap/ui/core/Core",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap.ui.getCore().byId", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.getCore().byId("test");`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getSymbolAtLocation(callExpression.expression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Method,
		name: "byId",
		parent: {
			kind: Ui5TypeInfoKind.Class,
			name: "Core",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.ui.core",
				name: "sap/ui/core/Core",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: sap/ui/base/Object 'isObjectA' static method", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/base/Object"], function(BaseObject) {
			BaseObject.isObjectA(new BaseObject(), "sap.ui.base.Object");
		});`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getSymbolAtLocation(callExpression.expression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.StaticMethod,
		name: "isObjectA",
		parent: {
			kind: Ui5TypeInfoKind.Class,
			name: "BaseObject",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.ui.core",
				name: "sap/ui/base/Object",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Class", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/routing/Router"], function(Router) {
			new Router([], {})
		});`
	);

	const callExpression = testContext.getFirstNewExpression();
	const symbol = testContext.checker.getTypeAtLocation(callExpression.expression).symbol;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Class,
		name: "Router",
		parent: {
			kind: Ui5TypeInfoKind.Module,
			library: "sap.ui.core",
			name: "sap/ui/core/routing/Router",
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Enum", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.AccessibleRole;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Enum,
		name: "AccessibleRole",
		parent: {
			kind: Ui5TypeInfoKind.Module,
			library: "sap.ui.core",
			name: "sap/ui/core/library",
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Enum value", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.AccessibleRole.Alert;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.EnumMember,
		name: "Alert",
		parent: {
			kind: Ui5TypeInfoKind.Enum,
			name: "AccessibleRole",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.ui.core",
				name: "sap/ui/core/library",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Enum in namespace", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.routing.HistoryDirection;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Enum,
		name: "HistoryDirection",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "routing",
			parent: {
				kind: Ui5TypeInfoKind.Module,
				library: "sap.ui.core",
				name: "sap/ui/core/library",
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Enum value in namespace", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.routing.HistoryDirection.Forwards;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.EnumMember,
		name: "Forwards",
		parent: {
			kind: Ui5TypeInfoKind.Enum,
			name: "HistoryDirection",
			parent: {
				kind: Ui5TypeInfoKind.Namespace,
				name: "routing",
				parent: {
					kind: Ui5TypeInfoKind.Module,
					library: "sap.ui.core",
					name: "sap/ui/core/library",
				},
			},
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Function", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/base/assert"], function(assert) {
			assert();
		});`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getTypeAtLocation(callExpression.expression).symbol;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Function,
		name: "assert",
		parent: {
			kind: Ui5TypeInfoKind.Module,
			library: "sap.ui.core",
			name: "sap/base/assert",
		},
	} as Ui5TypeInfo);
});

test.serial("TypeInfo: Global Namespace", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(function() {
			sap.ui.view();
		});`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getTypeAtLocation(callExpression.expression).symbol;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol, t.context.apiExtract), {
		kind: Ui5TypeInfoKind.Function,
		name: "view",
		parent: {
			kind: Ui5TypeInfoKind.Namespace,
			name: "ui",
			parent: {
				kind: Ui5TypeInfoKind.Namespace,
				name: "sap",
			},
		},
	} as Ui5TypeInfo);
});

/* TODO: Only relevant for TypeScript code, as data types are only represented as types (e.g. string) in our DTS.
// sap.m.ValueCSSColor is deprecated as of 1.135
test.serial("TypeInfo: DataType", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.AbsoluteCSSSize;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/library",
		export: "routing.Forwards",
		name: "Forwards",
	});
});
*/

// TODO: Handling of inherited properties which are re-defined in a subclass (maybe appearing in sap.ui.comp)
