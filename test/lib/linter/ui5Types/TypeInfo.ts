import test from "ava";
import {createVirtualLanguageServiceHost} from "../../../../src/linter/ui5Types/host.js";
import LinterContext from "../../../../src/linter/LinterContext.js";
import SharedLanguageService from "../../../../src/linter/ui5Types/SharedLanguageService.js";
import ts from "typescript";
import {getSymbolForPropertyInConstructSignatures} from "../../../../src/linter/ui5Types/utils/utils.js";

test("TypeInfo: sap/m/Button 'tap' event", async (t) => {
	const sharedLanguageService = new SharedLanguageService();

	const fileContents = new Map<string, string>([
		["/resources/test/test.js",
			`
			sap.ui.define(["sap/m/Button"], function(Button) {
				new Button({
					tap: function() {
						console.log("Button tapped");
					}
				});
			});
			`,
		],
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

	t.truthy(sourceFile, "Source file should be created");

	const expressionStatement = sourceFile.statements[1] as ts.ExpressionStatement;
	const newExpression = expressionStatement.expression as ts.NewExpression;
	t.is(ts.SyntaxKind[newExpression.kind], "NewExpression");

	const classType = checker.getTypeAtLocation(newExpression.expression);

	const objectLiteralExpression = newExpression.arguments?.[0] as ts.ObjectLiteralExpression;
	t.is(ts.SyntaxKind[objectLiteralExpression.kind], "ObjectLiteralExpression");

	const tapPropertyAssignment = objectLiteralExpression.properties[0] as ts.PropertyAssignment;
	t.is(ts.SyntaxKind[tapPropertyAssignment.kind], "PropertyAssignment");

	const propertySymbol = getSymbolForPropertyInConstructSignatures(
		classType.getConstructSignatures(), 0, (tapPropertyAssignment.name as ts.Identifier).text
	);

	const typeInfo = TypeInfo.getTypeInfoFromSymbol(propertySymbol);
});
