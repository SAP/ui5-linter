import anyTest, {TestFn} from "ava";
import {createVirtualLanguageServiceHost} from "../../../../src/linter/ui5Types/host.js";
import LinterContext from "../../../../src/linter/LinterContext.js";
import SharedLanguageService from "../../../../src/linter/ui5Types/SharedLanguageService.js";
import ts from "typescript";
import {getSymbolForPropertyInConstructSignatures} from "../../../../src/linter/ui5Types/utils/utils.js";
import {getUi5TypeInfoFromSymbol, Ui5TypeInfo, Ui5TypeInfoKind} from "../../../../src/linter/ui5Types/Ui5TypeInfo.js";

class TestContext {
	constructor(
		public program: ts.Program,
		public checker: ts.TypeChecker,
		public sourceFile: ts.SourceFile
	) {}

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
	initTestContext: (sourceFileContent: string) => Promise<TestContext>;
}>;

// Note: Tests in this file are serial because they use a shared language service instance.

test.before((t) => {
	t.context.sharedLanguageService = new SharedLanguageService();
	t.context.initTestContext = async (sourceFileContent: string) => {
		const sharedLanguageService = t.context.sharedLanguageService;

		const fileContents = new Map<string, string>([
			["/resources/test/test.js", sourceFileContent],
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
		const sourceFile = program.getSourceFile("/resources/test/test.js")!;

		return new TestContext(program, checker, sourceFile);
	};
});

test.afterEach.always((t) => {
	// Ensure to always release the shared language service after each test
	// so that the next test can acquire it again.
	t.context.sharedLanguageService.release();
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
		propertySymbol
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataProperty,
		name: "text",
		className: "sap.m.Button",
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
		propertySymbol
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataAssociation,
		name: "ariaDescribedBy",
		className: "sap.m.Button",
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
		propertySymbol
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataAggregation,
		name: "rows",
		className: "sap.ui.table.Table",
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
		propertySymbol
	);

	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.MetadataEvent,
		name: "tap",
		className: "sap.m.Button",
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

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/Core",
		export: "byId",
		basename: "byId",
	});
});

test.serial("TypeInfo: sap.ui.getCore().byId", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.getCore().byId("test");`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getSymbolAtLocation(callExpression.expression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/Core",
		export: "byId",
		basename: "byId",
	});
});

test.serial("TypeInfo: sap/ui/base/Object 'extend' static method", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/base/Object"], function(BaseObject) {
			BaseObject.isObjectA(new BaseObject(), "sap.ui.base.Object");
		});`
	);

	const callExpression = testContext.getFirstCallExpression();
	const symbol = testContext.checker.getSymbolAtLocation(callExpression.expression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/base/Object",
		export: "isObjectA",
		basename: "isObjectA",
	});
});

test.serial("TypeInfo: Enum", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.AccessibleRole;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/library",
		export: "AccessibleRole",
		basename: "AccessibleRole",
	});
});

test.serial("TypeInfo: Enum value", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.AccessibleRole.Alert;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/library",
		export: "Alert",
		basename: "Alert",
	});
});

test.serial("TypeInfo: Enum in namespace", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.routing.HistoryDirection;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/library",
		export: "routing.HistoryDirection",
		basename: "HistoryDirection",
	});
});

test.serial("TypeInfo: Enum value in namespace", async (t) => {
	const testContext = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/library"], function(coreLibrary) {
			coreLibrary.routing.HistoryDirection.Forwards;
		});`
	);

	const propertyAccessExpression = testContext.getFirstPropertyAccessExpression();
	const symbol = testContext.checker.getSymbolAtLocation(propertyAccessExpression)!;

	t.deepEqual(getUi5TypeInfoFromSymbol(symbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/library",
		export: "routing.Forwards",
		basename: "Forwards",
	});
});

/* TODO
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
		basename: "Forwards",
	});
});
*/
