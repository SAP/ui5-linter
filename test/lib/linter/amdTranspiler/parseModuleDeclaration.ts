import test from "ava";
import ts from "typescript";
import {ModuleDeclaration, DefineCallArgument, _matchArgumentsToParameters} from
	"../../../../src/linter/ui5Types/amdTranspiler/parseModuleDeclaration.js";
const {SyntaxKind} = ts;

test("All parameters provided directly", (t) => {
	const args = [{
		kind: SyntaxKind.StringLiteral,
	}, {
		kind: SyntaxKind.ArrayLiteralExpression,
	}, {
		kind: SyntaxKind.FunctionExpression,
	}, {
		kind: SyntaxKind.TrueKeyword,
	}] as DefineCallArgument[];

	t.deepEqual(_matchArgumentsToParameters(args), {
		dependencies: {
			kind: SyntaxKind.ArrayLiteralExpression,
		},
		export: {
			kind: SyntaxKind.TrueKeyword,
		},
		factory: {
			kind: SyntaxKind.FunctionExpression,
		},
		moduleName: {
			kind: SyntaxKind.StringLiteral,
		},
	}, "Matched parameters correctly");
});

test("Factory provided", (t) => {
	const args = [{
		kind: SyntaxKind.FunctionExpression,
	}] as DefineCallArgument[];

	t.deepEqual(_matchArgumentsToParameters(args), {
		factory: {
			kind: SyntaxKind.FunctionExpression,
		},
	}, "Matched parameters correctly");
});

test("Dependencies and Factory provided", (t) => {
	const args = [{
		kind: SyntaxKind.ArrayLiteralExpression,
	}, {
		kind: SyntaxKind.FunctionExpression,
	}] as DefineCallArgument[];

	t.deepEqual(_matchArgumentsToParameters(args), {
		dependencies: {
			kind: SyntaxKind.ArrayLiteralExpression,
		},
		factory: {
			kind: SyntaxKind.FunctionExpression,
		},
	}, "Matched parameters correctly");
});

test("Module Name, Dependencies and Factory provided", (t) => {
	const args = [{
		kind: SyntaxKind.StringLiteral,
	}, {
		kind: SyntaxKind.ArrayLiteralExpression,
	}, {
		kind: SyntaxKind.FunctionExpression,
	}] as DefineCallArgument[];

	t.deepEqual(_matchArgumentsToParameters(args), {
		moduleName: {
			kind: SyntaxKind.StringLiteral,
		},
		dependencies: {
			kind: SyntaxKind.ArrayLiteralExpression,
		},
		factory: {
			kind: SyntaxKind.FunctionExpression,
		},
	}, "Matched parameters correctly");
});

test("Dependencies, Factory and Export provided", (t) => {
	const args = [{
		kind: SyntaxKind.ArrayLiteralExpression,
	}, {
		kind: SyntaxKind.FunctionExpression,
	}, {
		kind: SyntaxKind.TrueKeyword,
	}] as DefineCallArgument[];

	t.deepEqual(_matchArgumentsToParameters(args), {
		dependencies: {
			kind: SyntaxKind.ArrayLiteralExpression,
		},
		factory: {
			kind: SyntaxKind.FunctionExpression,
		},
		export: {
			kind: SyntaxKind.TrueKeyword,
		},
	}, "Matched parameters correctly");
});

interface TestArguments {
	args: DefineCallArgument[];
	expected: ModuleDeclaration;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateArguments(possibleParameterTypes: any) {
	const permutations: TestArguments[] = [];
	for (const moduleNameKind of possibleParameterTypes.moduleName) {
		for (const dependenciesKind of possibleParameterTypes.dependencies) {
			for (const factoryKind of possibleParameterTypes.factory) {
				for (const exportKind of possibleParameterTypes.export) {
					const moduleName = {
						kind: moduleNameKind,
					} as ModuleDeclaration["moduleName"];
					const dependencies = {
						kind: dependenciesKind,
					} as ModuleDeclaration["dependencies"];
					const factory = {
						kind: factoryKind,
					} as ModuleDeclaration["factory"];
					const exp = {
						kind: exportKind,
					} as ModuleDeclaration["export"];

					// Adapt expectation based on which parameters are omitted and which ones are required
					const expected: Partial<ModuleDeclaration> = {};
					if (moduleNameKind) {
						expected.moduleName = moduleName;
					} else if (!dependenciesKind && factoryKind === SyntaxKind.StringLiteral) {
						// If dependencies are omitted and factory is a string, it's the module name
						// (given that there's a parameter that can be used for the factory)
						expected.moduleName = factory as ModuleDeclaration["moduleName"];
					}

					if (dependenciesKind && expected.moduleName !== dependencies) {
						expected.dependencies = dependencies;
					} else if (factoryKind === SyntaxKind.ArrayLiteralExpression) {
						expected.dependencies = factory as ModuleDeclaration["dependencies"];
					}

					if (factoryKind && expected.dependencies !== factory && expected.moduleName !== factory) {
						expected.factory = factory;
					} else if (exportKind) {
						expected.factory = exp;
					}

					if (exportKind && expected.factory !== exp) {
						expected.export = exp;
					}
					const args = [moduleName, dependencies, factory, exp] as DefineCallArgument[];
					permutations.push({
						args,
						expected: expected as ModuleDeclaration,
					});
				}
			}
		}
	}
	return permutations;
}

function resolveSyntaxKind(decl: ModuleDeclaration) {
	const res = Object.create(null);
	for (const key in decl) {
		const prop = decl[key as keyof ModuleDeclaration];
		if (prop?.kind) {
			res[key] = ts.SyntaxKind[prop.kind];
		}
	}
	return res;
}

function argsToString(args: DefineCallArgument[]): string {
	return args.map((param) => {
		if (!param?.kind) {
			return "<omitted>";
		}
		return SyntaxKind[param.kind];
	}).join(", ");
}

function declToString(decl: ModuleDeclaration): string {
	const args = [decl.moduleName, decl.dependencies, decl.factory, decl.export] as DefineCallArgument[];
	return argsToString(args);
}

test("All combinations", (t) => {
	const permutations = generateArguments({
		moduleName: [SyntaxKind.StringLiteral, null], // null means to omit the argument
		dependencies: [SyntaxKind.ArrayLiteralExpression, null], // null means to omit the argument
		factory: [
			SyntaxKind.FunctionExpression, SyntaxKind.ArrowFunction,
			SyntaxKind.StringLiteral, SyntaxKind.ArrayLiteralExpression,
			SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword,
		],
		export: [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword, null], // null means to omit the argument
	});

	t.true(permutations.length > 0, `Generated ${permutations.length} permutations`);
	permutations.forEach(({args, expected}) => {
		// Omit any parameters with "kind" set to null
		const res = _matchArgumentsToParameters(args.filter((_) => _?.kind));
		// eslint-disable-next-line ava/assertion-arguments -- https://github.com/avajs/eslint-plugin-ava/issues/332
		t.deepEqual(
			resolveSyntaxKind(res),
			resolveSyntaxKind(expected),
			`Permutation: [${argsToString(args)}]` +
			`\nExpected:    [${declToString(expected)}] ` +
			`\nResult:      [${declToString(res)}]`);
	});
});
