import anyTest, {TestFn} from "ava";
import {createVirtualLanguageServiceHost} from "../../../../src/linter/ui5Types/host.js";
import LinterContext from "../../../../src/linter/LinterContext.js";
import SharedLanguageService from "../../../../src/linter/ui5Types/SharedLanguageService.js";
import ts from "typescript";
import {getSymbolForPropertyInConstructSignatures} from "../../../../src/linter/ui5Types/utils/utils.js";
import {getUi5TypeInfoFromSymbol, Ui5TypeInfoKind} from "../../../../src/linter/ui5Types/Ui5TypeInfo.js";

const test = anyTest as TestFn<{
	sharedLanguageService: SharedLanguageService;
	initTestContext: (sourceFileContent: string) => Promise<{
		program: ts.Program; checker: ts.TypeChecker; sourceFile: ts.SourceFile;
	}>;
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
		const sourceFile = program.getSourceFile("/resources/test/test.js");

		return {
			program,
			checker,
			sourceFile: sourceFile!,
		};
	};
});

test.afterEach.always((t) => {
	// Ensure to always release the shared language service after each test
	// so that the next test can acquire it again.
	t.context.sharedLanguageService.release();
});

test.serial("TypeInfo: sap/m/Button 'tap' event", async (t) => {
	const {checker, sourceFile} = await t.context.initTestContext(`
		sap.ui.define(["sap/m/Button"], function(Button) {
			new Button({
				tap: function() {}
			});
		});`
	);

	const expressionStatement = sourceFile.statements[1] as ts.ExpressionStatement;
	t.is(ts.SyntaxKind[expressionStatement.kind], "ExpressionStatement");
	const newExpression = expressionStatement.expression as ts.NewExpression;
	t.is(ts.SyntaxKind[newExpression.kind], "NewExpression");

	const classType = checker.getTypeAtLocation(newExpression.expression);

	const objectLiteralExpression = newExpression.arguments?.[0] as ts.ObjectLiteralExpression;
	t.is(ts.SyntaxKind[objectLiteralExpression.kind], "ObjectLiteralExpression");

	const tapPropertyAssignment = objectLiteralExpression.properties[0] as ts.PropertyAssignment;
	t.is(ts.SyntaxKind[tapPropertyAssignment.kind], "PropertyAssignment");

	const propertySymbol = getSymbolForPropertyInConstructSignatures(
		classType.getConstructSignatures(), 0, (tapPropertyAssignment.name as ts.Identifier).text
	)!;

	t.is(propertySymbol.name, "tap");

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(propertySymbol);
	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/m/Button",
		export: "tap",
		basename: "tap",
	});
});

test.serial("TypeInfo: sap/ui/core/Core 'byId' method", async (t) => {
	const {checker, sourceFile} = await t.context.initTestContext(`
		sap.ui.define(["sap/ui/core/Core"], function(Core) {
			Core.byId("test");
		});`
	);

	const expressionStatement = sourceFile.statements[1] as ts.ExpressionStatement;
	t.is(ts.SyntaxKind[expressionStatement.kind], "ExpressionStatement");
	const callExpression = expressionStatement.expression as ts.CallExpression;
	t.is(ts.SyntaxKind[callExpression.kind], "CallExpression");

	const symbol = checker.getSymbolAtLocation(callExpression.expression)!;
	t.is(symbol.name, "byId");

	const ui5TypeInfo = getUi5TypeInfoFromSymbol(symbol);
	t.deepEqual(ui5TypeInfo, {
		kind: Ui5TypeInfoKind.Module,
		module: "sap/ui/core/Core",
		export: "byId",
		basename: "byId",
	});
});
