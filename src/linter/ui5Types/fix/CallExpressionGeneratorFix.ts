import ts from "typescript";
import {ChangeAction} from "../../../autofix/autofix.js";
import {PositionInfo} from "../../LinterContext.js";
import CallExpressionBaseFix, {CallExpressionBaseFixParams} from "./CallExpressionBaseFix.js";

export interface CallExpressionGeneratorFixParams<GeneratorContext extends object> extends CallExpressionBaseFixParams {
	/**
	 * Validation: If set to true, the fix will only be applied if the return value of the code does not use the
	 * return value of the call expression.
	 */
	mustNotUseReturnValue?: boolean;

	/**
	 * The generator function will be used to determine the value of the replacement, affecting
	 * the whole call expression
	 *
	 * If the return value is undefined, no change will be generated
	 */
	generator: (
		ctx: GeneratorContext, identifierName: string | undefined, ...args: string[]
	) => string | undefined;

	/**
	 * Validate the arguments of the call expression, optionally using the provided checker
	 *
	 * This hook may also collect information that affects the generator. For that, it can store
	 * information in the provided context object, which can be retrieved later in the generator function
	 */
	validateArguments?: (ctx: GeneratorContext, checker: ts.TypeChecker, ...args: ts.Expression[]) => boolean;
}

export default class CallExpressionGeneratorFix<GeneratorContext extends object> extends CallExpressionBaseFix {
	protected generatorArgs: string[] | undefined;
	protected generatorContext = {} as GeneratorContext;

	constructor(protected params: CallExpressionGeneratorFixParams<GeneratorContext>) {
		super(params);
	}

	visitLinterNode(node: ts.Node, sourcePosition: PositionInfo, checker: ts.TypeChecker) {
		if (!super.visitLinterNode(node, sourcePosition, checker)) {
			return false;
		}
		if (!ts.isCallExpression(node)) {
			return false;
		}
		if (this.params.validateArguments) {
			if (!this.params.validateArguments(this.generatorContext, checker, ...node.arguments)) {
				return false;
			}
		}
		return true;
	}

	visitAutofixNode(node: ts.Node, position: number, sourceFile: ts.SourceFile) {
		if (!super.visitAutofixNode(node, position, sourceFile)) {
			return false;
		}
		if (!ts.isCallExpression(node)) {
			return false;
		}

		// Collect arguments for the generator function
		this.generatorArgs = node.arguments.map((arg) => {
			return arg.getFullText();
		});
		return true;
	}

	generateChanges() {
		if (this.startPos === undefined || this.endPos === undefined || !this.generatorArgs) {
			throw new Error("Start, end position or arguments are not defined");
		}
		if (this.params.moduleName && !this.moduleIdentifierName) {
			// The identifier for the requested module has not been set
			// This can happen for example if the position of the autofix is not inside
			// a module definition or require block. Therefore the required dependency can not be added
			// and the fix can not be applied.
			return;
		}
		if (this.params.globalName && !this.globalIdentifierName) {
			// This should not happen
			throw new Error("Global identifier has not been provided");
		}

		const value = this.params.generator(
			this.generatorContext, this.globalIdentifierName ?? this.moduleIdentifierName, ...this.generatorArgs);
		if (!value) {
			return;
		}
		return {
			action: ChangeAction.REPLACE,
			start: this.startPos,
			end: this.endPos,
			value,
		};
	}
}
