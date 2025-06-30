import ts from "typescript";
import Fix from "./Fix.js";
import CallExpressionFix, {CallExpressionFixParams} from "./CallExpressionFix.js";
import AccessExpressionFix, {AccessExpressionFixParams} from "./AccessExpressionFix.js";
import type Ui5TypeInfoMatcher from "../Ui5TypeInfoMatcher.js";
import {getModuleTypeInfo, Ui5TypeInfo, Ui5TypeInfoKind} from "../Ui5TypeInfo.js";
import getJqueryFixInfo, {JqueryFixInfo} from "./getJqueryFixInfo.js";
import {AmbientModuleCache} from "../AmbientModuleCache.js";
import getGlobalFixInfo, {GlobalFixInfo} from "./getGlobalFixInfo.js";
import CallExpressionGeneratorFix, {CallExpressionGeneratorFixParams} from "./CallExpressionGeneratorFix.js";
import AccessExpressionGeneratorFix, {AccessExpressionGeneratorFixParams} from "./AccessExpressionGeneratorFix.js";
import PropertyAssignmentFix, {PropertyAssignmentFixParams} from "./PropertyAssignmentFix.js";
import PropertyAssignmentGeneratorFix, {
	PropertyAssignmentGeneratorFixParams,
} from "./PropertyAssignmentGeneratorFix.js";

const AUTOFIX_COLLECTIONS = [
	"sapUiCoreFixes",
	"jqueryFixes",
	"sapMFixes",
	"sapUiLayoutFixes",
	"sapUiCompFixes",
	"globalFixes",
];

interface FixCollection {
	default: FixTypeInfoMatcher;
};

export type FixCallback = () => Fix;
export type FixTypeInfoMatcher = Ui5TypeInfoMatcher<FixCallback>;

export default class FixFactory {
	private constructor(
		private checker: ts.TypeChecker,
		private ambientModuleCache: AmbientModuleCache,
		private collections: Map<string, FixTypeInfoMatcher>
	) {}

	static async create(checker: ts.TypeChecker, ambientModuleCache: AmbientModuleCache) {
		const collections = new Map<string, FixTypeInfoMatcher>();
		for (const collectionName of AUTOFIX_COLLECTIONS) {
			const {default: filter} = await import(`./collections/${collectionName}.js`) as FixCollection;
			const libraryName = filter.getLibraryName();
			if (!libraryName) {
				throw new Error(
					`Fix collection ${collectionName} must define a library name in the constructor`);
			}
			collections.set(libraryName, filter);
		}
		return new FixFactory(checker, ambientModuleCache, collections);
	}

	getFix(node: ts.Node, ui5TypeInfo: Ui5TypeInfo): Fix | undefined {
		const moduleTypeInfo = getModuleTypeInfo(ui5TypeInfo);
		let collection;
		if (moduleTypeInfo) {
			collection = moduleTypeInfo.library;
		} else {
			// If no module type info is available, we assume it's a global fix
			collection = "global";
		}
		const filter = this.collections.get(collection);
		if (!filter) {
			return; // No collection found for the library
		}

		const fixCallback = filter.match(ui5TypeInfo);
		if (!fixCallback) {
			return;
		}
		return fixCallback();
	}

	getJqueryFixInfo(node: ts.Node): JqueryFixInfo | undefined {
		if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) {
			// Only PropertyAccessExpressions are supported for jQuery fixes
			return;
		}
		const fixInfo = getJqueryFixInfo(node);
		if (!fixInfo) {
			return;
		}
		let {ui5TypeInfo, relevantNode} = fixInfo;

		const filter = this.collections.get("jquery")!;

		while (!filter.match(ui5TypeInfo)) {
			if (ui5TypeInfo.kind === Ui5TypeInfoKind.Module || !ui5TypeInfo.parent) {
				// We reached the module type info, but it does not match the filter
				return;
			}
			ui5TypeInfo = ui5TypeInfo.parent;
			if (ts.isCallExpression(relevantNode)) {
				relevantNode = relevantNode.expression as ts.AccessExpression;
			}
			relevantNode = relevantNode.expression as ts.AccessExpression;
		}
		return {
			ui5TypeInfo,
			relevantNode,
		};
	}

	getGlobalFixInfo(node: ts.CallExpression | ts.AccessExpression): GlobalFixInfo | undefined {
		return getGlobalFixInfo(node, this.ambientModuleCache);
	}
}

export function accessExpressionFix(params: AccessExpressionFixParams): () => AccessExpressionFix {
	return () => new AccessExpressionFix(params);
}

export function accessExpressionGeneratorFix(
	params: AccessExpressionGeneratorFixParams
): () => AccessExpressionGeneratorFix {
	return () => new AccessExpressionGeneratorFix(params);
}

export function callExpressionFix(params: CallExpressionFixParams): () => CallExpressionFix {
	return () => new CallExpressionFix(params);
}

export function callExpressionGeneratorFix<GeneratorContext extends object = object>(
	params: CallExpressionGeneratorFixParams<GeneratorContext>
): () => CallExpressionGeneratorFix<GeneratorContext> {
	return () => new CallExpressionGeneratorFix<GeneratorContext>(params);
}

export function propertyAssignmentFix(params: PropertyAssignmentFixParams): () => PropertyAssignmentFix {
	return () => new PropertyAssignmentFix(params);
}

export function propertyAssignmentGeneratorFix<GeneratorContext extends object = object>(
	params: PropertyAssignmentGeneratorFixParams<GeneratorContext>
): () => PropertyAssignmentGeneratorFix<GeneratorContext> {
	return () => new PropertyAssignmentGeneratorFix(params);
}
