import ts, {Identifier} from "typescript";
import Reporter from "../Reporter.js";
import {CoverageCategory, LintMessageSeverity, LintResult} from "../AbstractDetector.js";

interface DeprecationInfo {
	symbol: ts.Symbol;
	messageDetails?: string;
}

export default class FileLinter {
	#filePath: string;
	#sourceFile: ts.SourceFile;
	#checker: ts.TypeChecker;
	#reporter: Reporter;
	#boundVisitNode: (node: ts.Node) => void;
	#reportCoverage: boolean;
	#messageDetails: boolean;

	constructor(
		rootDir: string, filePath: string, sourceFile: ts.SourceFile, sourceMap: string | undefined,
		checker: ts.TypeChecker, reportCoverage: boolean | undefined = false,
		messageDetails: boolean | undefined = false
	) {
		this.#filePath = filePath;
		this.#sourceFile = sourceFile;
		this.#checker = checker;
		this.#reporter = new Reporter(rootDir, filePath, sourceFile, sourceMap);
		this.#boundVisitNode = this.visitNode.bind(this);
		this.#reportCoverage = reportCoverage;
		this.#messageDetails = messageDetails;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async getReport(): Promise<LintResult> {
		try {
			this.visitNode(this.#sourceFile);
			return this.#reporter.getReport();
		} catch (err) {
			if (err instanceof Error) {
				throw new Error(`Failed to produce report for ${this.#filePath}: ${err.message}`, {
					cause: err,
				});
			}
			throw err;
		}
	}

	visitNode(node: ts.Node) {
		if (node.kind === ts.SyntaxKind.NewExpression) { // e.g. "new Button({\n\t\t\t\tblocked: true\n\t\t\t})"
			const nodeType = this.#checker.getTypeAtLocation(node); // checker.getContextualType(node);
			if (nodeType.symbol && this.isSymbolOfUi5OrThirdPartyType(nodeType.symbol)) {
				this.analyzeNewExpression(nodeType, node as ts.NewExpression);
			}
		} else if (node.kind === ts.SyntaxKind.CallExpression) { // ts.isCallLikeExpression too?
			// const nodeType = this.#checker.getTypeAtLocation(node);
			this.analyzePropertyAccessExpression(node as ts.CallExpression); // Check for global
			this.analyzeCallExpression(node as ts.CallExpression); // Check for deprecation
			this.analyzeLibInitCall(node as ts.CallExpression); // Check for sap/ui/core/Lib.init usages
		} else if (node.kind === ts.SyntaxKind.PropertyAccessExpression ||
		node.kind === ts.SyntaxKind.ElementAccessExpression) {
			this.analyzePropertyAccessExpression(
				node as (ts.PropertyAccessExpression | ts.ElementAccessExpression)); // Check for global
			this.analyzePropertyAccessExpressionForDeprecation(
				node as (ts.PropertyAccessExpression | ts.ElementAccessExpression)); // Check for deprecation
		} else if (node.kind === ts.SyntaxKind.ImportDeclaration) {
			this.analyzeImportDeclaration(node as ts.ImportDeclaration); // Check for deprecation
		}

		// Traverse the whole AST from top to bottom
		ts.forEachChild(node, this.#boundVisitNode);
	}

	analyzeNewExpression(nodeType: ts.Type, node: ts.NewExpression) {
		const classType = this.#checker.getTypeAtLocation(node.expression);

		// There can be multiple and we need to find the right one
		const [constructSignature] = classType.getConstructSignatures();

		node.arguments?.forEach((arg, argIdx) => {
			const argumentType = constructSignature.getTypeParameterAtPosition(argIdx);
			if (ts.isObjectLiteralExpression(arg)) {
				arg.properties.forEach((prop) => {
					if (ts.isPropertyAssignment(prop)) { // TODO: Necessary?
						const propNameIdentifier = prop.name as Identifier;
						const propText = propNameIdentifier.escapedText || propNameIdentifier.text;
						const propertySymbol = argumentType.getProperty(propText);

						// this.#checker.getContextualType(arg) // same as nodeType
						// const propertySymbol = allProps.find((symbol) => {
						// 	return symbol.escapedName === propNameIdentifier;
						// });
						if (propertySymbol) {
							const deprecationInfo = this.getDeprecationInfo(propertySymbol);
							if (deprecationInfo) {
								this.#reporter.addMessage({
									node: prop,
									severity: LintMessageSeverity.Error,
									ruleId: "ui5-linter-no-deprecated-api",
									message: `Use of deprecated property '${propertySymbol.escapedName as string}' ` +
									`of class '${this.#checker.typeToString(nodeType)}'`,
									messageDetails: deprecationInfo.messageDetails,
								});
							}
						}
					}
				});
			}
		});
	}

	extractNamespace(node: ts.PropertyAccessExpression): string {
		const propAccessChain: string[] = [];
		propAccessChain.push(node.expression.getText());

		let scanNode: ts.Node = node;
		while (ts.isPropertyAccessExpression(scanNode)) {
			if (!ts.isIdentifier(scanNode.name)) {
				throw new Error(
					`Unexpected PropertyAccessExpression node: Expected name to be identifier but got ` +
					ts.SyntaxKind[scanNode.name.kind]);
			}
			propAccessChain.push(scanNode.name.getText());
			scanNode = scanNode.parent;
		}
		return propAccessChain.join(".");
	}

	getDeprecationText(deprecatedTag: ts.JSDocTagInfo): string {
		// (Workaround) There's an issue in some UI5 TS definition versions and where the
		// deprecation text gets merged with the description. Splitting on double
		// new line could be considered as a clear separation between them.
		// https://github.com/SAP/ui5-typescript/issues/429
		return deprecatedTag.text?.reduce((acc, text) => acc + text.text, "").split("\n\n")[0] ?? "";
	}

	getDeprecationInfo(symbol: ts.Symbol | undefined): DeprecationInfo | null {
		if (symbol && this.isSymbolOfUi5Type(symbol)) {
			const jsdocTags = symbol.getJsDocTags(this.#checker);
			const deprecatedTag = jsdocTags.find((tag) => tag.name === "deprecated");
			if (deprecatedTag) {
				const deprecationInfo: DeprecationInfo = {
					symbol,
				};
				if (this.#messageDetails) {
					deprecationInfo.messageDetails = this.getDeprecationText(deprecatedTag);
				}
				return deprecationInfo;
			}
		}
		return null;
	}

	analyzeCallExpression(node: ts.CallExpression) {
		const exprNode = node.expression;
		const exprType = this.#checker.getTypeAtLocation(exprNode);
		if (!(exprType?.symbol && this.isSymbolOfUi5OrThirdPartyType(exprType.symbol))) {
			if (this.#reportCoverage) {
				this.handleCallExpressionUnknownType(exprType, node);
			}
			return;
		}

		if (ts.isNewExpression(exprNode)) {
			// e.g. new Class()();
			// This is usually unexpected and there are currently no known deprecations of functions
			// returned by a class constructor.
			// However, the OPA Matchers are a known exception where constructors do return a function.
			return;
		}

		if (!ts.isPropertyAccessExpression(exprNode) &&
			!ts.isElementAccessExpression(exprNode) &&
			!ts.isIdentifier(exprNode)) {
			// TODO: Transform into coverage message if it's really ok not to handle this
			throw new Error(`Unhandled CallExpression expression syntax: ${ts.SyntaxKind[exprNode.kind]}`);
		}

		const deprecationInfo = this.getDeprecationInfo(exprType?.symbol);
		if (!deprecationInfo) {
			return;
		}

		let symbol;
		if (ts.isPropertyAccessExpression(exprNode)) {
			symbol = this.#checker.getSymbolAtLocation(exprNode.name);
		} else if (ts.isElementAccessExpression(exprNode)) {
			symbol = this.#checker.getSymbolAtLocation(exprNode.argumentExpression);
		} else { // Identifier
			symbol = this.#checker.getSymbolAtLocation(exprNode);
		}

		if (!symbol) {
			throw new Error(`Failed to determine symbol for deprecated node of type ${ts.SyntaxKind[exprNode.kind]}`);
		}

		let additionalMessage = "";
		// Get the type to the left of the call expression (i.e. what the function is being called on)
		const classNodeType = this.findClassOrInterface(node.expression);
		if (classNodeType) {
			additionalMessage = ` of class '${this.#checker.typeToString(classNodeType)}'`;
		} else if (ts.isPropertyAccessExpression(exprNode)) {
			additionalMessage = ` (${this.extractNamespace(exprNode)})`;
		}
		this.#reporter.addMessage({
			node,
			severity: LintMessageSeverity.Error,
			ruleId: "ui5-linter-no-deprecated-api",
			message:
				`Call to deprecated function ` +
				`'${symbol.escapedName as string}'${additionalMessage}`,
			messageDetails: deprecationInfo.messageDetails,
		});
	}

	getSymbolModuleDeclaration(symbol: ts.Symbol) {
		let parent = symbol.valueDeclaration?.parent;
		while (parent && !ts.isModuleDeclaration(parent)) {
			parent = parent.parent;
		}
		return parent;
	}

	analyzeLibInitCall(node: ts.CallExpression) {
		const nodeExp = (
			ts.isIdentifier(node.expression) || // Assignment `const LibInit = Library.init` and destructuring
			ts.isPropertyAccessExpression(node.expression) ||
			ts.isElementAccessExpression(node.expression)) && node.expression;
		const nodeType = nodeExp && this.#checker.getTypeAtLocation(nodeExp);
		if (!nodeType || !nodeType.symbol || nodeType.symbol.getName() !== "init") {
			return;
		}

		const moduleDeclaration = this.getSymbolModuleDeclaration(nodeType.symbol);
		if (!moduleDeclaration || moduleDeclaration.name.text !== "sap/ui/core/Lib") {
			return;
		}

		const initArg = node?.arguments[0] &&
			ts.isObjectLiteralExpression(node.arguments[0]) && node.arguments[0];

		let nodeToHighlight;

		if (!initArg) {
			nodeToHighlight = node;
		} else {
			const apiVersionNode = initArg.properties.find((prop) => {
				return ts.isPropertyAssignment(prop) &&
					ts.isIdentifier(prop.name) &&
					prop.name.text === "apiVersion";
			});

			if (!apiVersionNode) { // No arguments or no 'apiVersion' property
				nodeToHighlight = node;
			} else if (ts.isPropertyAssignment(apiVersionNode) &&
			apiVersionNode.initializer.getText() !== "2") { // String value would be "\"2\""
				nodeToHighlight = apiVersionNode;
			}
		}

		if (nodeToHighlight) {
			let importedVarName: string;
			if (ts.isIdentifier(nodeExp)) {
				importedVarName = nodeExp.getText();
			} else {
				importedVarName = nodeExp.expression.getText() + ".init";
			}

			this.#reporter.addMessage({
				node: nodeToHighlight,
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-no-partially-deprecated-api",
				message:
					`Call to ${importedVarName}() must be declared with property {apiVersion: 2}`,
			});
		}
	}

	getDeprecationInfoForAccess(node: ts.AccessExpression): DeprecationInfo | null {
		let symbol;
		if (ts.isPropertyAccessExpression(node)) {
			symbol = this.#checker.getSymbolAtLocation(node.name);
		} else { // ElementAccessExpression
			symbol = this.#checker.getSymbolAtLocation(node.argumentExpression);
		}
		return this.getDeprecationInfo(symbol);
	}

	analyzePropertyAccessExpressionForDeprecation(node: ts.AccessExpression) {
		if (ts.isCallExpression(node.parent)) {
			// TODO: Swap with call expression check?
			return; // Already analyzed in context of call expression
		}

		const deprecationInfo = this.getDeprecationInfoForAccess(node);
		if (deprecationInfo) {
			if (this.isSymbolOfJquerySapType(deprecationInfo.symbol)) {
				let namespace;
				if (ts.isPropertyAccessExpression(node)) {
					namespace = this.extractNamespace(node);
				}
				this.#reporter.addMessage({
					node,
					severity: LintMessageSeverity.Error,
					ruleId: "ui5-linter-no-deprecated-api",
					message:
						`Use of deprecated API ` +
						`'${namespace ?? "jQuery.sap"}'`,
					messageDetails: deprecationInfo.messageDetails,
				});
			} else {
				this.#reporter.addMessage({
					node,
					severity: LintMessageSeverity.Error,
					ruleId: "ui5-linter-no-deprecated-property",
					message:
						`Access of deprecated property ` +
						`'${deprecationInfo.symbol.escapedName as string}'`,
					messageDetails: deprecationInfo.messageDetails,
				});
			}
		}
	}

	handleCallExpressionUnknownType(nodeType: ts.Type, node: ts.CallExpression) {
		const typeString = this.#checker.typeToString(nodeType);
		let identifier;
		if (ts.isPropertyAccessExpression(node.expression)) {
			identifier = node.expression.name;
		}
		if (typeString === "any" && !ts.isImportDeclaration(node.parent.parent)) {
			this.#reporter.addCoverageInfo({
				node,
				category: CoverageCategory.CallExpressionUnknownType,
				message:
					`Unable to analyze this method call because the type of identifier` +
					`${identifier ? " \"" + identifier.getText() + "\"" : ""} in "${node.getText()}"" ` +
					`could not be determined`,
			});
		}
	}

	analyzePropertyAccessExpression(node: ts.AccessExpression | ts.CallExpression) {
		const exprNode = node.expression;
		if (ts.isIdentifier(exprNode)) {
			// The expression being an identifier indicates that this is the first access
			// in a possible chain. E.g. the "sap" in "sap.ui.getCore()"

			let symbol;

			// Get the NodeType in order to check whether this is indirect global access via Window
			const nodeType = this.#checker.getTypeAtLocation(exprNode);
			if (this.#checker.typeToString(nodeType) === "Window & typeof globalThis") {
				// In case of Indirect global access we need to check for
				// a global UI5 variable on the right side of the expression instead of left
				if (ts.isPropertyAccessExpression(node)) {
					symbol = this.#checker.getSymbolAtLocation(node.name);
				} else if (ts.isElementAccessExpression(node)) {
					symbol = this.#checker.getSymbolAtLocation(node.argumentExpression);
				} else { // Identifier
					symbol = this.#checker.getSymbolAtLocation(node);
				}
			} else {
				// No access via Window. Check the left side of the expression
				symbol = this.#checker.getSymbolAtLocation(exprNode);
			}

			// If a symbol could be determined, check whether it is a symbol of a UI5 Type.
			// Note: If this is a local variable, the symbol would be different
			// In case it is, ensure it is not one of the allowed PropertyAccessExpressions, such as "sap.ui.require"
			if (symbol && this.isSymbolOfUi5OrThirdPartyType(symbol) &&
				!(ts.isPropertyAccessExpression(node) && this.isAllowedPropertyAccess(node))) {
				this.#reporter.addMessage({
					node,
					severity: LintMessageSeverity.Error,
					ruleId: "ui5-linter-no-globals-js",
					message:
						`Access of global variable '${symbol.getName()}' ` +
						`(${this.extractNamespace((node as ts.PropertyAccessExpression))})`,
				});
			}
		}
	}

	isAllowedPropertyAccess(node: ts.PropertyAccessExpression): boolean {
		if (!ts.isIdentifier(node.expression)) {
			// TODO: Fixme if this happens
			throw new Error(
				`Unhandled PropertyAccessExpression expression syntax: ${ts.SyntaxKind[node.expression.kind]}`);
		}
		if (["require", "define", "QUnit", "sinon"].includes(node.expression.getText())) {
			return true;
		}

		const propAccess = this.extractNamespace(node);
		return [
			"sap.ui.define",
			"sap.ui.require",
			"sap.ui.require.toUrl",
			"sap.ui.loader.config",
		].some((allowedAccessString) => {
			return propAccess == allowedAccessString || propAccess.startsWith(allowedAccessString + ".");
		});
	}

	analyzeImportDeclaration(importDeclarationNode: ts.ImportDeclaration) {
		const moduleSpecifierNode = importDeclarationNode.moduleSpecifier;
		if (!ts.isStringLiteral(moduleSpecifierNode)) {
			// An ImportDeclaration moduleSpecifier is of type Expression, but the docs says:
			// "If this is not a StringLiteral it will be a grammar error."
			// So we ignore such cases here.
			return;
		}
		const symbol = this.#checker.getSymbolAtLocation(moduleSpecifierNode);
		// Only check for the "default" export regardless of what's declared
		// as UI5 / AMD only supports importing the default anyways.
		// TODO: This needs to be enhanced in future
		const defaultExportSymbol = symbol?.exports?.get("default" as ts.__String);
		const deprecationInfo = this.getDeprecationInfo(defaultExportSymbol);
		if (deprecationInfo) {
			this.#reporter.addMessage({
				node: moduleSpecifierNode,
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-no-deprecated-api",
				message:
					`Import of deprecated module ` +
					`'${moduleSpecifierNode.text}'`,
				messageDetails: deprecationInfo.messageDetails,
			});
		}
	}

	isSymbolOfUi5Type(symbol: ts.Symbol) {
		if (symbol.name.startsWith("sap/")) {
			return true;
		} else {
			const sourceFile = symbol.valueDeclaration?.getSourceFile();
			if (sourceFile?.fileName.match(/@openui5|@sapui5|@ui5/)) {
				return true;
			}
		}
		return false;
	}

	isSymbolOfUi5OrThirdPartyType(symbol: ts.Symbol) {
		if (symbol.name.startsWith("sap/")) {
			return true;
		} else {
			const sourceFile = symbol.valueDeclaration?.getSourceFile();
			if (sourceFile?.fileName.match(/@openui5|@sapui5|@ui5|@types\/jquery/)) {
				return true;
			}
		}
		return false;
	}

	isSymbolOfJquerySapType(symbol: ts.Symbol) {
		return symbol.valueDeclaration?.getSourceFile().fileName === "/types/@ui5/linter/overrides/jquery.sap.d.ts";
	}

	findClassOrInterface(node: ts.Node): ts.Type | undefined {
		let nodeType: ts.Type | undefined = this.#checker.getTypeAtLocation(node);
		if (nodeType.isClassOrInterface()) {
			return nodeType;
		}

		// Check child nodes recursively to cover cases such as node being a PropertyAccessExpression
		nodeType = ts.forEachChild<ts.Type>(node, (childNode) => {
			return this.findClassOrInterface(childNode);
		});

		return nodeType;
	}
}
