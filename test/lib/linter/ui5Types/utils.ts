import test from "ava";
import ts, {factory} from "typescript";
import {
	getPropertyNameText,
	getPropertyAssignmentInObjectLiteralExpression,
	getPropertyAssignmentsInObjectLiteralExpression,
	findClassMember,
	getSymbolForPropertyInConstructSignatures,
	isClassMethod,
} from "../../../../src/linter/ui5Types/utils.js";

function createProgram(code: string) {
	const compilerOptions: ts.CompilerOptions = {
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ES2022,
		skipLibCheck: true,
		lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
		allowJs: true,
		checkJs: false,
		strict: true,
		noImplicitAny: false,
		strictNullChecks: false,
		strictPropertyInitialization: false,
		rootDir: "/",
		allowSyntheticDefaultImports: true,
	};
	const host = ts.createCompilerHost(compilerOptions);
	host.getSourceFile = (fileName) => {
		if (fileName === "test.ts") {
			return ts.createSourceFile("test.ts", code, compilerOptions.target!, true, ts.ScriptKind.JS);
		}
		return undefined;
	};
	return ts.createProgram(["test.ts"], compilerOptions, host);
}

test("getPropertyNameText - string literal", (t) => {
	const node = factory.createStringLiteral("test");
	t.is(getPropertyNameText(node), "test");
});

test("getPropertyNameText - numeric literal", (t) => {
	const node = factory.createNumericLiteral(123);
	t.is(getPropertyNameText(node), "123");
});

test("getPropertyNameText - identifier", (t) => {
	const node = factory.createIdentifier("test");
	t.is(getPropertyNameText(node), "test");
});

test("getPropertyNameText - computed property name", (t) => {
	const node = factory.createComputedPropertyName(factory.createStringLiteral("test"));
	t.is(getPropertyNameText(node), "test");
});

test("getPropertyNameText - invalid node", (t) => {
	const node = factory.createComputedPropertyName(factory.createNumericLiteral(123));
	t.is(getPropertyNameText(node), undefined);
});

test("getSymbolForPropertyInConstructSignatures - symbol found", (t) => {
	const program = createProgram(`
		class Foo {
			constructor (options: { bar: boolean }) {
			}
		}
		new Foo({bar: true});
	`);
	const checker = program.getTypeChecker();

	const expressionStatement = program.getSourceFile("test.ts")!.statements[1] as ts.ExpressionStatement;
	const newExpression = expressionStatement.expression as ts.NewExpression;

	const classType = checker.getTypeAtLocation(newExpression.expression);
	const signatures = classType.getConstructSignatures();

	const symbol = getSymbolForPropertyInConstructSignatures(signatures, 0, "bar");

	t.truthy(symbol);
	t.is(symbol?.name, "bar");
});

test("getSymbolForPropertyInConstructSignatures - symbol not found", (t) => {
	const program = createProgram(`
		class Foo {
			constructor (options: { bar: boolean }) {
			}
		}
		new Foo({bar: true});
	`);
	const checker = program.getTypeChecker();

	const expressionStatement = program.getSourceFile("test.ts")!.statements[1] as ts.ExpressionStatement;
	const newExpression = expressionStatement.expression as ts.NewExpression;

	const classType = checker.getTypeAtLocation(newExpression.expression);
	const signatures = classType.getConstructSignatures();

	const symbol = getSymbolForPropertyInConstructSignatures(signatures, 0, "foo");

	t.is(symbol, undefined);
});

test("getSymbolForPropertyInConstructSignatures - invalid argumentPosition", (t) => {
	const program = createProgram(`
		class Foo {
			constructor (options: { bar: boolean }) {
			}
		}
		new Foo({bar: true});
	`);
	const checker = program.getTypeChecker();

	const expressionStatement = program.getSourceFile("test.ts")!.statements[1] as ts.ExpressionStatement;
	const newExpression = expressionStatement.expression as ts.NewExpression;

	const classType = checker.getTypeAtLocation(newExpression.expression);
	const signatures = classType.getConstructSignatures();

	const symbol = getSymbolForPropertyInConstructSignatures(signatures, 7, "bar");

	t.is(symbol, undefined);
});

test("findClassMember - member found", (t) => {
	const propertyDeclaration = factory.createPropertyDeclaration([], "foo", undefined, undefined, undefined);
	const classNode = factory.createClassDeclaration([], "Test", [], [], [propertyDeclaration]);
	const result = findClassMember(classNode, "foo");
	t.is(result, propertyDeclaration);
});

test("findClassMember - member not found", (t) => {
	const propertyDeclaration = factory.createPropertyDeclaration([], "bar", undefined, undefined, undefined);
	const classNode = factory.createClassDeclaration([], "Test", [], [], [propertyDeclaration]);
	const result = findClassMember(classNode, "foo");
	t.is(result, undefined);
});

test("findClassMember - with constructor", (t) => {
	const constructorDeclaration = factory.createConstructorDeclaration(undefined, [], undefined);
	const propertyDeclaration = factory.createPropertyDeclaration([], "foo", undefined, undefined, undefined);
	const classNode = factory.createClassDeclaration([], "Test", [], [], [constructorDeclaration, propertyDeclaration]);
	const result = findClassMember(classNode, "foo");
	t.is(result, propertyDeclaration);
});

test("findClassMember - with modifiers", (t) => {
	const propertyDeclaration = factory.createPropertyDeclaration([
		factory.createToken(ts.SyntaxKind.StaticKeyword),
	], "foo", undefined, undefined, undefined);
	const classNode = factory.createClassDeclaration([], "Test", [], [], [propertyDeclaration]);
	const result = findClassMember(classNode, "foo", [{modifier: ts.SyntaxKind.StaticKeyword}]);
	t.is(result, propertyDeclaration);
});

test("findClassMember - with modifiers (not)", (t) => {
	const propertyDeclaration = factory.createPropertyDeclaration([
		factory.createToken(ts.SyntaxKind.StaticKeyword),
	], "foo", undefined, undefined, undefined);
	const classNode = factory.createClassDeclaration([], "Test", [], [], [propertyDeclaration]);
	const result = findClassMember(classNode, "foo", [{not: true, modifier: ts.SyntaxKind.StaticKeyword}]);
	t.is(result, undefined);
});

test("findClassMember - with modifiers (mixed)", (t) => {
	const propertyDeclaration = factory.createPropertyDeclaration([
		factory.createToken(ts.SyntaxKind.StaticKeyword),
	], "foo", undefined, undefined, undefined);
	const classNode = factory.createClassDeclaration([], "Test", [], [], [propertyDeclaration]);
	const result = findClassMember(classNode, "foo", [
		{modifier: ts.SyntaxKind.StaticKeyword},
		{modifier: ts.SyntaxKind.AbstractKeyword, not: true},
	]);
	t.is(result, propertyDeclaration);
});

test("isClassMethod - MethodDeclaration", (t) => {
	const program = createProgram(`
		class Foo {
			bar() {
			}
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.true(isClassMethod(classMember, checker));
});

test("isClassMethod - PropertyDeclaration (FunctionExpression)", (t) => {
	const program = createProgram(`
		class Foo {
			bar = function() {}
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.true(isClassMethod(classMember, checker));
});

test("isClassMethod - PropertyDeclaration (ArrayFunction)", (t) => {
	const program = createProgram(`
		class Foo {
			bar = () => "abc"
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.true(isClassMethod(classMember, checker));
});

test("isClassMethod - PropertyDeclaration (Identifier)", (t) => {
	const program = createProgram(`
		function barFunction() {}
		class Foo {
			bar = barFunction
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[1] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.true(isClassMethod(classMember, checker));
});

test("isClassMethod - static method", (t) => {
	const program = createProgram(`
		class Foo {
			static bar() {
			}
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.true(isClassMethod(classMember, checker));
});

test("isClassMethod - no initializer", (t) => {
	const program = createProgram(`
		class Foo {
			bar
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.false(isClassMethod(classMember, checker));
});

test("isClassMethod - no MethodDeclaration or PropertyDeclaration (GetAccessor)", (t) => {
	const program = createProgram(`
		class Foo {
			get bar() {
				return "abc";
			}
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.false(isClassMethod(classMember, checker));
});

test("isClassMethod - no function (PropertyDeclaration with Identifier)", (t) => {
	const program = createProgram(`
		const barValue = "abc";
		class Foo {
			bar = barValue
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[1] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.false(isClassMethod(classMember, checker));
});

test("isClassMethod - no function (PropertyDeclaration with StringLiteral)", (t) => {
	const program = createProgram(`
		class Foo {
			bar = "abc"
		}
	`);
	const checker = program.getTypeChecker();

	const classDeclaration = program.getSourceFile("test.ts")!.statements[0] as ts.ClassDeclaration;
	const classMember = classDeclaration.members[0];

	t.false(isClassMethod(classMember, checker));
});

test("getPropertyAssignmentInObjectLiteralExpression - property found", (t) => {
	const test1 = factory.createPropertyAssignment("test1", factory.createStringLiteral("value1"));
	const node = factory.createObjectLiteralExpression([test1]);
	const result = getPropertyAssignmentInObjectLiteralExpression("test1", node);
	t.is(result, test1);
});

test("getPropertyAssignmentInObjectLiteralExpression - property not found", (t) => {
	const node = factory.createObjectLiteralExpression([]);
	const result = getPropertyAssignmentInObjectLiteralExpression("test1", node);
	t.is(result, undefined);
});

test("getPropertyAssignmentsInObjectLiteralExpression - multiple properties", (t) => {
	const node = factory.createObjectLiteralExpression([
		factory.createPropertyAssignment("test1", factory.createStringLiteral("value1")),
		factory.createPropertyAssignment("test2", factory.createStringLiteral("value2")),
	]);
	const result = getPropertyAssignmentsInObjectLiteralExpression(["test1", "test2"], node);
	t.is(result.length, 2);
	t.truthy(result[0]);
	t.truthy(result[1]);
});

test("getPropertyAssignmentsInObjectLiteralExpression - partial match", (t) => {
	const test1 = factory.createPropertyAssignment("test1", factory.createStringLiteral("value1"));
	const test3 = factory.createPropertyAssignment("test3", factory.createStringLiteral("value3"));
	const test4 = factory.createPropertyAssignment("test4", factory.createStringLiteral("value4"));
	const test5 = factory.createPropertyAssignment("test5", factory.createStringLiteral("value5"));
	const test6 = factory.createPropertyAssignment("test6", factory.createStringLiteral("value6"));
	const node = factory.createObjectLiteralExpression([
		test1, test3, test4, factory.createSpreadAssignment(factory.createIdentifier("foo")), test5, test6,
	]);
	const result = getPropertyAssignmentsInObjectLiteralExpression([
		"test0", "test1", "test2", "test3", "test4", "test5", "test6", "test7",
	], node);
	t.is(result.length, 8);
	t.deepEqual(result, [
		undefined, test1, undefined, test3, test4, test5, test6, undefined,
	]);
});

test("getPropertyAssignmentsInObjectLiteralExpression - properties not found", (t) => {
	const node = factory.createObjectLiteralExpression([]);
	const result = getPropertyAssignmentsInObjectLiteralExpression(["test1", "test2"], node);
	t.is(result.length, 2);
	t.is(result[0], undefined);
	t.is(result[1], undefined);
});

test("getPropertyAssignmentsInObjectLiteralExpression - unsupported elements", (t) => {
	const test1 = factory.createPropertyAssignment("test1", factory.createStringLiteral("value1"));
	const test2 = factory.createPropertyAssignment("test2", factory.createStringLiteral("value2"));
	const spreadAssignment = factory.createSpreadAssignment(factory.createIdentifier("foo"));
	const shorthandPropertyAssignment = factory.createShorthandPropertyAssignment("bar");
	const node = factory.createObjectLiteralExpression([
		test1, spreadAssignment, shorthandPropertyAssignment, test2,
	]);
	const result = getPropertyAssignmentsInObjectLiteralExpression(["test1", "test2"], node);
	t.is(result.length, 2);
	t.is(result[0], test1);
	t.is(result[1], test2);
});
