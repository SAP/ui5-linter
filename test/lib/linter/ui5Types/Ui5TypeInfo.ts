import anyTest, {TestFn} from "ava";
import {createVirtualLanguageServiceHost} from "../../../../src/linter/ui5Types/host.js";
import LinterContext from "../../../../src/linter/LinterContext.js";
import SharedLanguageService from "../../../../src/linter/ui5Types/SharedLanguageService.js";
import ts from "typescript";
import {getSymbolForPropertyInConstructSignatures} from "../../../../src/linter/ui5Types/utils/utils.js";
import {getUi5TypeInfoFromSymbol, Ui5TypeInfoKind} from "../../../../src/linter/ui5Types/Ui5TypeInfo.js";

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

	t.deepEqual(getUi5TypeInfoFromSymbol(propertySymbol), {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/m/Button",
		export: "tap",
		basename: "tap",
	});
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
