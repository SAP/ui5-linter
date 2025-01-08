import anyTest, {TestFn} from "ava";
import sinonGlobal from "sinon";
import ts, {SyntaxKind} from "typescript";
import {
	getPropertyName,
	getPropertyAssignmentInObjectLiteralExpression,
	getPropertyAssignmentsInObjectLiteralExpression,
	findClassMember,
} from "../../../../src/linter/ui5Types/utils.js";

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
}>;

function createSourceFile(code: string): ts.SourceFile {
	return ts.createSourceFile("test.js", code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
}

test.beforeEach((t) => {
	t.context.sinon = sinonGlobal.createSandbox();
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("getPropertyName: ClassDeclaration", (t) => {
	const sourceFile = createSourceFile(`
		class Test {
			foo = "bar";
		}`);
	const classDeclaration = sourceFile.statements[0] as ts.ClassDeclaration;
	const firstMember = classDeclaration.members[0];
	const firstMemberName = firstMember.name!;
	t.is(getPropertyName(firstMemberName), "foo");
});

test("getPropertyAssignmentInObjectLiteralExpression", (t) => {
	const sourceFile = createSourceFile(`
		JSON.stringify({
			property1: 1,
			"property2": 2,
			'property3': 3,
			["property4"]: 4,
			['property5']: 5,
			[\`property6\`]: 6,
		});`);
	const expressionStatement = sourceFile.statements[0] as ts.ExpressionStatement;
	const callExpression = expressionStatement.expression as ts.CallExpression;
	const objectLiteralExpression = callExpression.arguments[0] as ts.ObjectLiteralExpression;
	t.is(
		getPropertyAssignmentInObjectLiteralExpression("property1", objectLiteralExpression)!.getText(),
		`property1: 1`
	);
	t.is(
		getPropertyAssignmentInObjectLiteralExpression("property2", objectLiteralExpression)!.getText(),
		`"property2": 2`
	);
	t.is(
		getPropertyAssignmentInObjectLiteralExpression("property3", objectLiteralExpression)!.getText(),
		`'property3': 3`
	);
	t.is(
		getPropertyAssignmentInObjectLiteralExpression("property4", objectLiteralExpression)!.getText(),
		`["property4"]: 4`
	);
	t.is(
		getPropertyAssignmentInObjectLiteralExpression("property5", objectLiteralExpression)!.getText(),
		`['property5']: 5`
	);
	t.is(
		getPropertyAssignmentInObjectLiteralExpression("property6", objectLiteralExpression)!.getText(),
		`[\`property6\`]: 6`
	);
});

test("getPropertyAssignmentsInObjectLiteralExpression", (t) => {
	const sourceFile = createSourceFile(`
		JSON.stringify({
			property1: 1,
			"property2": 2,
			'property3': 3,
			["property4"]: 4,
			['property5']: 5,
			[\`property6\`]: 6,
		});`);
	const expressionStatement = sourceFile.statements[0] as ts.ExpressionStatement;
	const callExpression = expressionStatement.expression as ts.CallExpression;
	const objectLiteralExpression = callExpression.arguments[0] as ts.ObjectLiteralExpression;

	const [property2, property1] = getPropertyAssignmentsInObjectLiteralExpression(
		["property2", "property1"], objectLiteralExpression);

	t.is(
		property1!.getText(),
		`property1: 1`
	);
	t.is(
		property2!.getText(),
		`"property2": 2`
	);
});

test("findClassMember", (t) => {
	const sourceFile = createSourceFile(`
		class Test {
			foo = "bar";
		}`);
	const classDeclaration = sourceFile.statements[0] as ts.ClassDeclaration;
	t.is(findClassMember(classDeclaration, "foo")?.getText(), `foo = "bar";`);
});

test("findClassMember (static)", (t) => {
	const sourceFile = createSourceFile(`
		class Test {
			static foo = "bar";
		}`);
	const classDeclaration = sourceFile.statements[0] as ts.ClassDeclaration;
	t.is(findClassMember(classDeclaration, "foo", [SyntaxKind.StaticKeyword])?.getText(), `static foo = "bar";`);
});
