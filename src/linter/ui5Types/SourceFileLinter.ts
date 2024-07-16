import ts, {Identifier} from "typescript";
import path from "node:path/posix";
import SourceFileReporter from "./SourceFileReporter.js";
import LinterContext, {ResourcePath, CoverageCategory, LintMessageSeverity} from "../LinterContext.js";
import {RULES, MESSAGES, formatMessage} from "../linterReporting.js";
import analyzeComponentJson from "./asyncComponentFlags.js";
import {deprecatedLibraries} from "../../utils/deprecations.js";

interface DeprecationInfo {
	symbol: ts.Symbol;
	messageDetails?: string;
}

export default class SourceFileLinter {
	#resourcePath: ResourcePath;
	#sourceFile: ts.SourceFile;
	#checker: ts.TypeChecker;
	#context: LinterContext;
	#reporter: SourceFileReporter;
	#boundVisitNode: (node: ts.Node) => void;
	#reportCoverage: boolean;
	#messageDetails: boolean;
	#dataTypes: Record<string, string>;
	#manifestContent: string | undefined;
	#fileName: string;
	#isComponent: boolean;

	constructor(
		context: LinterContext, resourcePath: ResourcePath,
		sourceFile: ts.SourceFile, sourceMap: string | undefined, checker: ts.TypeChecker,
		reportCoverage: boolean | undefined = false, messageDetails: boolean | undefined = false,
		dataTypes: Record<string, string> | undefined, manifestContent?: string | undefined
	) {
		this.#resourcePath = resourcePath;
		this.#sourceFile = sourceFile;
		this.#checker = checker;
		this.#context = context;
		this.#reporter = new SourceFileReporter(context, resourcePath, sourceFile, sourceMap);
		this.#boundVisitNode = this.visitNode.bind(this);
		this.#reportCoverage = reportCoverage;
		this.#messageDetails = messageDetails;
		this.#manifestContent = manifestContent;
		this.#fileName = path.basename(resourcePath);
		this.#isComponent = this.#fileName === "Component.js" || this.#fileName === "Component.ts";
		this.#dataTypes = dataTypes ?? {};
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {
			this.visitNode(this.#sourceFile);
			this.#reporter.deduplicateMessages();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.#context.addLintingMessage(this.#resourcePath, {
				severity: LintMessageSeverity.Error,
				message,
				ruleId: RULES["ui5-linter-parsing-error"],
				fatal: true,
			});
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
		} else if (node.kind === ts.SyntaxKind.ExpressionWithTypeArguments && this.#isComponent) {
			analyzeComponentJson({
				node: node as ts.ExpressionWithTypeArguments,
				manifestContent: this.#manifestContent,
				resourcePath: this.#resourcePath,
				reporter: this.#reporter,
				context: this.#context,
				checker: this.#checker,
			});
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
									ruleId: RULES["ui5-linter-no-deprecated-api"],
									message: formatMessage(MESSAGES.SHORT__DEPRECATED_PROP_OF_CLASS,
										propertySymbol.escapedName as string, this.#checker.typeToString(nodeType)),
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
		if (!exprType?.symbol || !this.isSymbolOfUi5OrThirdPartyType(exprType.symbol)) {
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
		} else if (exprNode.kind === ts.SyntaxKind.SuperKeyword) {
			// Ignore super calls
			return;
		}

		if (!ts.isPropertyAccessExpression(exprNode) &&
			!ts.isElementAccessExpression(exprNode) &&
			!ts.isIdentifier(exprNode)) {
			// TODO: Transform into coverage message if it's really ok not to handle this
			throw new Error(`Unhandled CallExpression expression syntax: ${ts.SyntaxKind[exprNode.kind]}`);
		}

		const deprecationInfo = this.getDeprecationInfo(exprType.symbol);
		if (!deprecationInfo) {
			return;
		}

		let reportNode;
		if (ts.isPropertyAccessExpression(exprNode)) {
			reportNode = exprNode.name;
		} else if (ts.isElementAccessExpression(exprNode)) {
			reportNode = exprNode.argumentExpression;
		} else { // Identifier
			reportNode = exprNode;
		}

		let additionalMessage = "";
		if (exprNode.kind === ts.SyntaxKind.PropertyAccessExpression ||
			exprNode.kind === ts.SyntaxKind.ElementAccessExpression) {
			// Get the type to the left of the call expression (i.e. what the function is being called on)
			const lhsExpr = exprNode.expression;
			const lhsExprType = this.#checker.getTypeAtLocation(lhsExpr);
			if (lhsExprType.isClassOrInterface()) {
				// left-hand-side is an instance of a class, e.g. "instance.deprecatedMethod()"
				additionalMessage = ` of class '${this.#checker.typeToString(lhsExprType)}'`;
			} else if (ts.isCallExpression(lhsExpr)) {
				// left-hand-side is a function call, e.g. "function().deprecatedMethod()"
				// Use the (return) type of that function call
				additionalMessage = ` of module '${this.#checker.typeToString(lhsExprType)}'`;
			} else if (ts.isPropertyAccessExpression(exprNode)) {
				// left-hand-side is a module or namespace, e.g. "module.deprecatedMethod()"
				additionalMessage = ` (${this.extractNamespace(exprNode)})`;
			}
		}

		let reportNodeText;
		if (ts.isStringLiteralLike(reportNode) || ts.isNumericLiteral(reportNode)) {
			reportNodeText = reportNode.text;
		} else {
			reportNodeText = reportNode.getText();
		}

		this.#reporter.addMessage({
			node: reportNode,
			severity: LintMessageSeverity.Error,
			ruleId: RULES["ui5-linter-no-deprecated-api"],
			message: formatMessage(MESSAGES.SHORT__DEPRECATED_FUNCTION_ACCESS,
				`'${reportNodeText}'${additionalMessage}`),
			messageDetails: deprecationInfo.messageDetails,
		});
	}

	getPropertyName(node: ts.PropertyName): string {
		if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
			return node.text;
		} else {
			return node.getText();
		}
	}

	getSymbolModuleDeclaration(symbol: ts.Symbol) {
		let parent = symbol.valueDeclaration?.parent;
		while (parent && !ts.isModuleDeclaration(parent)) {
			parent = parent.parent;
		}
		return parent;
	}

	analyzeLibInitCall(node: ts.CallExpression) {
		if (!ts.isIdentifier(node.expression) && // Assignment `const LibInit = Library.init` and destructuring
			!ts.isPropertyAccessExpression(node.expression) && /* Lib.init() */
			!ts.isElementAccessExpression(node.expression) /* Lib["init"]() */) {
			return;
		}

		const nodeExp = node.expression;
		const nodeType = this.#checker.getTypeAtLocation(nodeExp);
		if (!nodeType.symbol || nodeType.symbol.getName() !== "init") {
			return;
		}

		const moduleDeclaration = this.getSymbolModuleDeclaration(nodeType.symbol);
		if (!moduleDeclaration || moduleDeclaration.name.text !== "sap/ui/core/Lib") {
			return;
		}

		const initArg = node?.arguments[0] &&
			ts.isObjectLiteralExpression(node.arguments[0]) &&
			node.arguments[0];

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
				ruleId: RULES["ui5-linter-no-partially-deprecated-api"],
				message: formatMessage(MESSAGES.SHORT__LIB_INIT_2, importedVarName),
				messageDetails: this.#messageDetails ? formatMessage(MESSAGES.DETAILS__LIB_INIT_2) : undefined,
			});
		}

		if (initArg) {
			this.#analyzeLibInitDeprecatedLibs(initArg);
		}
	}

	#analyzeLibInitDeprecatedLibs(initArg: ts.ObjectLiteralExpression) {
		const dependenciesNode = initArg.properties.find((prop) => {
			return ts.isPropertyAssignment(prop) &&
				ts.isIdentifier(prop.name) &&
				prop.name.text === "dependencies";
		});

		if (!dependenciesNode ||
			!ts.isPropertyAssignment(dependenciesNode) ||
			!ts.isArrayLiteralExpression(dependenciesNode.initializer)) {
			return;
		}

		dependenciesNode.initializer.elements.forEach((dependency) => {
			let curLibName = "";
			if (ts.isStringLiteral(dependency)) {
				curLibName = dependency.text;
			}

			if (deprecatedLibraries.includes(curLibName)) {
				this.#reporter.addMessage({
					ruleId: RULES["ui5-linter-no-deprecated-api"],
					severity: LintMessageSeverity.Error,
					node: dependency,
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_LIBRARY, curLibName),
				});
			}
		});
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
					ruleId: RULES["ui5-linter-no-deprecated-api"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_API_ACCESS, namespace ?? "jQuery.sap"),
					messageDetails: deprecationInfo.messageDetails,
				});
			} else {
				this.#reporter.addMessage({
					node,
					severity: LintMessageSeverity.Error,
					ruleId: RULES["ui5-linter-no-deprecated-property"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_PROP_ACCESS,
						deprecationInfo.symbol.escapedName as string),
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

	isGlobalThis(nodeType: string) {
		return [
			"Window & typeof globalThis",
			"typeof globalThis",
			// "Window", // top and parent will resolve to this string, however they are still treated as type 'any'
		].includes(nodeType);
	}

	analyzePropertyAccessExpression(node: ts.AccessExpression | ts.CallExpression) {
		const exprNode = node.expression;
		if (ts.isIdentifier(exprNode)) {
			// The expression being an identifier indicates that this is the first access
			// in a possible chain. E.g. the "sap" in "sap.ui.getCore()"

			let symbol;

			// Get the NodeType in order to check whether this is indirect global access via Window
			const nodeType = this.#checker.getTypeAtLocation(exprNode);
			if (this.isGlobalThis(this.#checker.typeToString(nodeType))) {
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
					ruleId: RULES["ui5-linter-no-globals-js"],
					message: formatMessage(MESSAGES.SHORT__GLOBAL_VAR_ACCESS,
						symbol.getName(), this.extractNamespace((node as ts.PropertyAccessExpression))),
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
			return propAccess == allowedAccessString ||
				propAccess.startsWith(allowedAccessString + ".") ||
				propAccess.endsWith("." + allowedAccessString);
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
				ruleId: RULES["ui5-linter-no-deprecated-api"],
				message: formatMessage(MESSAGES.SHORT__DEPRECATED_MODULE_IMPORT,
					moduleSpecifierNode.text),
				messageDetails: deprecationInfo.messageDetails,
			});
		}

		if (this.isSymbolOfPseudoType(symbol)) {
			const moduleNamespaceName = moduleSpecifierNode.text.replaceAll("/", ".");
			const isDataType = !!this.#dataTypes[moduleNamespaceName];
			if (isDataType) {
				this.#reporter.addMessage({
					node: moduleSpecifierNode,
					severity: LintMessageSeverity.Error,
					ruleId: RULES["ui5-linter-no-pseudo-modules"],
					message: formatMessage(MESSAGES.SHORT__NO_DIRECT_DATATYPE_ACCESS, moduleSpecifierNode.text),
					messageDetails: formatMessage(MESSAGES.DETAILS__NO_DIRECT_DATATYPE_ACCESS, moduleNamespaceName),
				});
			} else { // Enum
				this.#reporter.addMessage({
					node: moduleSpecifierNode,
					severity: LintMessageSeverity.Error,
					ruleId: RULES["ui5-linter-no-pseudo-modules"],
					message: formatMessage(MESSAGES.SHORT__DEPRECATED_ACCESS_ENUM, moduleSpecifierNode.text),
					messageDetails: formatMessage(MESSAGES.DETAILS__DEPRECATED_ACCESS_ENUM),
				});
			}
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

	isSymbolOfPseudoType(symbol: ts.Symbol | undefined) {
		return symbol?.valueDeclaration?.getSourceFile().fileName.startsWith("/types/@ui5/linter/overrides/library/");
	}
}
