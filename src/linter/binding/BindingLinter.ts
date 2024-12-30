import LinterContext, {PositionInfo, ResourcePath} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";
import {RequireDeclaration} from "../xmlTemplate/Parser.js";
import BindingParser, {BindingInfo} from "./lib/BindingParser.js";

export default class BindingLinter {
	#resourcePath: string;
	#context: LinterContext;

	constructor(resourcePath: ResourcePath, context: LinterContext) {
		this.#resourcePath = resourcePath;
		this.#context = context;
	}

	#parseBinding(binding: string): BindingInfo {
		const bindingInfo = BindingParser.complexParser(binding, null, true, true, true, true);
		return bindingInfo;
	}

	#analyzeBinding(bindingInfo: BindingInfo, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		const {formatter} = bindingInfo;
		if (!formatter || formatter.startsWith(".")) {
			// Ignore no formatter or formatter referencing the controller (as indicated by the leading dot)
			return;
		}
		const parts = formatter.split(".");
		let variableName;
		if (parts.length) {
			variableName = parts[0];
		} else {
			variableName = formatter;
		}
		const requireDeclaration = requireDeclarations.find((decl) => decl.variableName === variableName);
		if (!requireDeclaration) {
			this.#context.addLintingMessage(this.#resourcePath, MESSAGE.NO_GLOBALS, {
				variableName,
				namespace: formatter,
			}, position);
		}
	}

	lintBinding(bindingDefinition: string, requireDeclarations: RequireDeclaration[], position: PositionInfo) {
		try {
			const bindingInfo = this.#parseBinding(bindingDefinition);
			if (bindingInfo) {
				this.#analyzeBinding(bindingInfo, requireDeclarations, position);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, MESSAGE.PARSING_ERROR, {message}, position);
		}
	}
}
