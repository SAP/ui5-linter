import ts, {Identifier} from "typescript";
import path from "node:path/posix";
import {getLogger} from "@ui5/logger";
import SourceFileReporter from "./SourceFileReporter.js";
import LinterContext, {ResourcePath, CoverageCategory} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";
import analyzeComponentJson from "./asyncComponentFlags.js";
import {deprecatedLibraries} from "../../utils/deprecations.js";
import {getPropertyName} from "./utils.js";
import {taskStart} from "../../utils/perf.js";
import {getPositionsForNode} from "../../utils/nodePosition.js";
import {TraceMap} from "@jridgewell/trace-mapping";

const log = getLogger("linter:ui5Types:SourceFileLinter");

interface DeprecationInfo {
	symbol: ts.Symbol;
	messageDetails: string;
}

function isSourceFileOfUi5Type(sourceFile: ts.SourceFile) {
	return /@openui5|@sapui5|@ui5/.test(sourceFile.fileName);
}

function isSourceFileOfUi5OrThirdPartyType(sourceFile: ts.SourceFile) {
	return /@openui5|@sapui5|@ui5|@types\/jquery/.test(sourceFile.fileName);
}

function isSourceFileOfJquerySapType(sourceFile: ts.SourceFile) {
	return sourceFile.fileName === "/types/@ui5/linter/overrides/jquery.sap.d.ts";
}

function isSourceFileOfPseudoModuleType(sourceFile: ts.SourceFile) {
	return sourceFile.fileName.startsWith("/types/@ui5/linter/overrides/library/");
}

function isSourceFileOfTypeScriptLib(sourceFile: ts.SourceFile) {
	return sourceFile.fileName.startsWith("/types/typescript/lib/");
}

export default class SourceFileLinter {
	#resourcePath: ResourcePath;
	#sourceFile: ts.SourceFile;
	#sourceMaps: Map<string, string> | undefined;
	#checker: ts.TypeChecker;
	#context: LinterContext;
	#reporter: SourceFileReporter;
	#boundVisitNode: (node: ts.Node) => void;
	#reportCoverage: boolean;
	#messageDetails: boolean;
	#dataTypes: Record<string, string>;
	#apiExtract: Record<string, Record<string, Record<string, string>>>;
	#manifestContent: string | undefined;
	#fileName: string;
	#isComponent: boolean;

	constructor(
		context: LinterContext, resourcePath: ResourcePath,
		sourceFile: ts.SourceFile, sourceMaps: Map<string, string> | undefined, checker: ts.TypeChecker,
		reportCoverage: boolean | undefined = false, messageDetails: boolean | undefined = false,
		dataTypes: Record<string, string> | undefined, manifestContent?: string,
		apiExtract?: Record<string, Record<string, Record<string, string>>>
	) {
		this.#resourcePath = resourcePath;
		this.#sourceFile = sourceFile;
		this.#sourceMaps = sourceMaps;
		this.#checker = checker;
		this.#context = context;
		this.#reporter = new SourceFileReporter(context, resourcePath,
			sourceFile, sourceMaps?.get(sourceFile.fileName));
		this.#boundVisitNode = this.visitNode.bind(this);
		this.#reportCoverage = reportCoverage;
		this.#messageDetails = messageDetails;
		this.#manifestContent = manifestContent;
		this.#fileName = path.basename(resourcePath);
		this.#isComponent = this.#fileName === "Component.js" || this.#fileName === "Component.ts";
		this.#dataTypes = dataTypes ?? {};
		this.#apiExtract = apiExtract ?? {};
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {
			this.visitNode(this.#sourceFile);
			this.#reporter.deduplicateMessages();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			log.verbose(`Error while linting ${this.#resourcePath}: ${message}`);
			if (err instanceof Error) {
				log.verbose(`Call stack: ${err.stack}`);
			}
			this.#context.addLintingMessage(this.#resourcePath, MESSAGE.PARSING_ERROR, {message});
		}
	}

	visitNode(node: ts.Node) {
		if (node.kind === ts.SyntaxKind.NewExpression) { // e.g. "new Button({\n\t\t\t\tblocked: true\n\t\t\t})"
			this.analyzeNewExpression(node as ts.NewExpression);
		} else if (node.kind === ts.SyntaxKind.CallExpression) { // ts.isCallLikeExpression too?
			// const nodeType = this.#checker.getTypeAtLocation(node);
			this.analyzePropertyAccessExpression(node as ts.CallExpression); // Check for global
			this.analyzeCallExpression(node as ts.CallExpression); // Check for deprecation
		} else if (node.kind === ts.SyntaxKind.PropertyAccessExpression ||
			node.kind === ts.SyntaxKind.ElementAccessExpression) {
			this.analyzePropertyAccessExpression(
				node as (ts.PropertyAccessExpression | ts.ElementAccessExpression)); // Check for global
			this.analyzePropertyAccessExpressionForDeprecation(
				node as (ts.PropertyAccessExpression | ts.ElementAccessExpression)); // Check for deprecation
		} else if (node.kind === ts.SyntaxKind.ObjectBindingPattern &&
			node.parent?.kind === ts.SyntaxKind.VariableDeclaration) {
			// e.g. `const { Button } = sap.m;`
			// This is a destructuring assignment and we need to check each property for deprecation
			this.analyzeObjectBindingPattern(node as ts.ObjectBindingPattern);
		} else if (node.kind === ts.SyntaxKind.ObjectLiteralExpression &&
			node.parent?.kind === ts.SyntaxKind.BinaryExpression &&
			node.parent?.parent?.kind === ts.SyntaxKind.ParenthesizedExpression) {
			// e.g. `({ Button }) = sap.m;`
			this.analyzeObjectLiteralExpression(node as ts.ObjectLiteralExpression);
		} else if (node.kind === ts.SyntaxKind.ImportDeclaration) {
			this.analyzeImportDeclaration(node as ts.ImportDeclaration); // Check for deprecation
		} else if (node.kind === ts.SyntaxKind.ImportSpecifier) {
			this.analyzeImportSpecifier(node as ts.ImportSpecifier);
		} else if (this.#isComponent && this.isUi5ClassDeclaration(node, "sap/ui/core/Component")) {
			analyzeComponentJson({
				classDeclaration: node,
				manifestContent: this.#manifestContent,
				resourcePath: this.#resourcePath,
				reporter: this.#reporter,
				context: this.#context,
				checker: this.#checker,
				isUIComponent: this.isUi5ClassDeclaration(node, "sap/ui/core/UIComponent"),
			});
		} else if (
			ts.isPropertyDeclaration(node) &&
			(ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
			node.name.text === "metadata" &&
			node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
			this.isUi5ClassDeclaration(node.parent, "sap/ui/base/ManagedObject")
		) {
			const visitMetadataNodes = (childNode: ts.Node) => {
				if (ts.isPropertyAssignment(childNode)) { // Skip nodes out of interest
					this.analyzeMetadataProperty(childNode.name.getText(), childNode);
				}

				ts.forEachChild(childNode, visitMetadataNodes);
			};
			ts.forEachChild(node, visitMetadataNodes);
		} else if (this.isUi5ClassDeclaration(node, "sap/ui/core/Control")) {
			this.analyzeControlRendererDeclaration(node);
		}

		// Traverse the whole AST from top to bottom
		ts.forEachChild(node, this.#boundVisitNode);
	}

	isUi5ClassDeclaration(node: ts.Node, baseClassModule: string | string[]): node is ts.ClassDeclaration {
		if (!ts.isClassDeclaration(node)) {
			return false;
		}
		const baseClassModules = Array.isArray(baseClassModule) ? baseClassModule : [baseClassModule];
		const baseClasses = baseClassModules.map((baseClassModule) => {
			return {module: baseClassModule, name: baseClassModule.split("/").pop()};
		});

		// Go up the hierarchy chain to find whether the class extends from the provided base class
		const isClassUi5Subclass = (node: ts.ClassDeclaration): boolean => {
			return node?.heritageClauses?.flatMap((parentClasses: ts.HeritageClause) => {
				return parentClasses.types.map((parentClass) => {
					const parentClassType = this.#checker.getTypeAtLocation(parentClass);

					return parentClassType.symbol?.declarations?.some((declaration) => {
						if (!ts.isClassDeclaration(declaration)) {
							return false;
						}
						for (const baseClass of baseClasses) {
							if (declaration.name?.getText() === baseClass.name &&
								(
								// Declaration via type definitions
									(
										declaration.parent.parent &&
										ts.isModuleDeclaration(declaration.parent.parent) &&
										declaration.parent.parent.name?.text === baseClass.module
									) ||
									// Declaration via real class (e.g. within sap.ui.core project)
									(
										ts.isSourceFile(declaration.parent) &&
										(
											declaration.parent.fileName === `/resources/${baseClass.module}.js` ||
											declaration.parent.fileName === `/resources/${baseClass.module}.ts`
										)
									)
								)
							) {
								return true;
							}
						}
						return isClassUi5Subclass(declaration);
					});
				});
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			}).reduce((acc, cur) => cur || acc, false) ?? false;
		};

		return isClassUi5Subclass(node);
	}

	analyzeControlRendererDeclaration(node: ts.ClassDeclaration) {
		const className = node.name?.getText() ?? "<unknown>";
		const rendererMember = node.members.find((member) => {
			return (ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) &&
				member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
				member.name.getText() === "renderer";
		});

		if (!rendererMember) {
			// Special cases: Some base classes do not require sub-classes to have a renderer defined:
			if (this.isUi5ClassDeclaration(node, [
				"sap/ui/core/mvc/View",
				// XMLComposite is deprecated, but there still shouldn't be a false-positive about a missing renderer
				"sap/ui/core/XMLComposite",
				"sap/ui/core/webc/WebComponent",
				"sap/uxap/BlockBase",
			])) {
				return;
			}
			// No definition of renderer causes the runtime to load the corresponding Renderer module synchronously
			this.#reporter.addMessage(MESSAGE.MISSING_CONTROL_RENDERER_DECLARATION, {className}, node);
			return;
		}

		if (ts.isPropertyDeclaration(rendererMember) && rendererMember.initializer) {
			const initializerType = this.#checker.getTypeAtLocation(rendererMember.initializer);

			if (initializerType.flags & ts.TypeFlags.Undefined ||
				initializerType.flags & ts.TypeFlags.Null) {
				// null / undefined can be used to declare that a control does not have a renderer
				return;
			}

			if (initializerType.flags & ts.TypeFlags.StringLiteral) {
				let rendererName;
				if (
					ts.isStringLiteral(rendererMember.initializer) ||
					ts.isNoSubstitutionTemplateLiteral(rendererMember.initializer)
				) {
					rendererName = rendererMember.initializer.text;
				}
				// Declaration as string requires sync loading of renderer module
				this.#reporter.addMessage(MESSAGE.CONTROL_RENDERER_DECLARATION_STRING, {
					className, rendererName,
				}, rendererMember.initializer);
			}

			// Analyze renderer property when it's referenced by a variable or even another module
			// i.e. { renderer: Renderer }
			if (ts.isIdentifier(rendererMember.initializer)) {
				const {symbol} = this.#checker.getTypeAtLocation(rendererMember);
				const {declarations} = symbol ?? {};
				declarations?.forEach((declaration) => this.analyzeControlRendererInternals(declaration));
			} else {
				// Analyze renderer property when it's directly embedded in the renderer object
				// i.e. { renderer: {apiVersion: "2", render: () => {}} }
				this.analyzeControlRendererInternals(rendererMember.initializer);
			}
		}
	}

	analyzeControlRendererInternals(node: ts.Node) {
		// Analyze renderer property when it's an ObjectLiteralExpression
		// i.e. { renderer: {apiVersion: "2", render: () => {}} }
		if (node && (ts.isObjectLiteralExpression(node) || ts.isVariableDeclaration(node))) {
			const apiVersionNode = ts.isObjectLiteralExpression(node) && node.properties.find((prop) => {
				return ts.isPropertyAssignment(prop) &&
					(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
					prop.name.text === "apiVersion";
			}) as ts.PropertyAssignment | undefined;

			let nodeToHighlight: ts.PropertyAssignment | ts.PropertyDeclaration |
				ts.VariableDeclaration | ts.ObjectLiteralExpression | undefined = undefined;
			if (!apiVersionNode) { // No 'apiVersion' property
				nodeToHighlight = node;
			} else if (apiVersionNode.initializer.getText() !== "2") { // String value would be "\"2\""
				nodeToHighlight = apiVersionNode;
			}

			if (nodeToHighlight) {
				// reporter.addMessage() won't work in this case as it's bound to the current analyzed file.
				// The findings can be in different file i.e. Control being analyzed,
				// but reporting might be in ControlRenderer
				const nodeSourceFile = nodeToHighlight.getSourceFile();
				const nodeSourceMap = this.#sourceMaps?.get(nodeSourceFile.fileName);
				this.#context.addLintingMessage(
					nodeSourceFile.fileName, MESSAGE.NO_DEPRECATED_RENDERER, undefined as never,
					getPositionsForNode({
						node: nodeToHighlight,
						sourceFile: nodeSourceFile,
						resourcePath: nodeSourceFile.fileName,
						traceMap: nodeSourceMap ? new TraceMap(nodeSourceMap) : undefined,
					}).start);
			}

			this.analyzeIconCallInRenderMethod(node);
		// Analyze renderer property when it's a function i.e. { renderer: () => {} }
		} else if (ts.isMethodDeclaration(node) || ts.isArrowFunction(node) ||
			ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
			// reporter.addMessage() won't work in this case as it's bound to the current analyzed file.
			// The findings can be in different file i.e. Control being analyzed,
			// but reporting might be in ControlRenderer
			const nodeSourceFile = node.getSourceFile();
			const nodeSourceMap = this.#sourceMaps?.get(nodeSourceFile.fileName);
			this.#context.addLintingMessage(
				nodeSourceFile.fileName, MESSAGE.NO_DEPRECATED_RENDERER, undefined as never,
				getPositionsForNode({
					node,
					sourceFile: nodeSourceFile,
					resourcePath: nodeSourceFile.fileName,
					traceMap: nodeSourceMap ? new TraceMap(nodeSourceMap) : undefined,
				}).start);

			this.analyzeIconCallInRenderMethod(node);
		}
	}

	// If there's an oRm.icon() call in the render method, we need to check if IconPool is imported.
	// Currently, we're only able to analyze whether oRm.icon is called in the render method as
	// there's no reliable way to find if the method icon() is actually a member of RenderManager in other places.
	analyzeIconCallInRenderMethod(node: ts.Node) {
		let renderMethodNode: ts.Node | undefined = node;

		// When the render is a plain function
		if (ts.isMethodDeclaration(node) || ts.isArrowFunction(node) ||
			ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
			renderMethodNode = node;
		} else if (ts.isObjectLiteralExpression(node)) {
			// When the render is embed into the renderer object
			const renderProperty = node.properties.find((prop) => {
				return ts.isPropertyAssignment(prop) &&
					ts.isIdentifier(prop.name) &&
					prop.name.text === "render";
			});
			renderMethodNode = (renderProperty && ts.isPropertyAssignment(renderProperty)) ?
				renderProperty.initializer :
				undefined;

			// When the renderer is a separate module and the render method is assigned
			// to the renderer object later i.e. myControlRenderer.render = function (oRm, oMyControl) {}
			if (!renderMethodNode) {
				let rendererObjectName = null;
				if ((ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent) ||
					ts.isVariableDeclaration(node.parent)) && ts.isIdentifier(node.parent.name)) {
					rendererObjectName = node.parent.name.getText();
				}

				const findRenderMethod = (childNode: ts.Node) => {
					if (ts.isBinaryExpression(childNode)) {
						if (ts.isPropertyAccessExpression(childNode.left)) {
							const objectName = childNode.left.expression.getText(); // myControlRenderer
							const propertyName = childNode.left.name.getText(); // render

							if (objectName === rendererObjectName && propertyName === "render") {
								renderMethodNode = childNode.right;
							}
						}
					}

					if (!renderMethodNode) { // If found, stop traversing
						ts.forEachChild(childNode, findRenderMethod);
					}
				};

				ts.forEachChild(node.getSourceFile(), findRenderMethod);
			}
		}

		if (!renderMethodNode) {
			return;
		}

		// If there's a dependency to IconPool from the Renderer,
		// it's fine and we can skip the rest of the checks
		const rendererSource = renderMethodNode.getSourceFile();
		const hasIconPoolImport = rendererSource.statements.some((importNode: ts.Statement) => {
			return ts.isImportDeclaration(importNode) &&
				ts.isStringLiteral(importNode.moduleSpecifier) &&
				importNode.moduleSpecifier.text === "sap/ui/core/IconPool";
		});

		if (hasIconPoolImport) {
			return;
		}

		const findIconCallExpression = (childNode: ts.Node) => {
			if (ts.isCallExpression(childNode) &&
				ts.isPropertyAccessExpression(childNode.expression) &&
				childNode.expression.name.getText() === "icon"
			) {
				// reporter.addMessage() won't work in this case as it's bound to the current analyzed file.
				// The findings can be in different file i.e. Control being analyzed,
				// but reporting might be in ControlRenderer
				const nodeSourceFile = childNode.getSourceFile();
				const nodeSourceMap = this.#sourceMaps?.get(nodeSourceFile.fileName);
				this.#context.addLintingMessage(
					nodeSourceFile.fileName, MESSAGE.NO_ICON_POOL_RENDERER, undefined as never,
					getPositionsForNode({
						node: childNode,
						sourceFile: nodeSourceFile,
						resourcePath: nodeSourceFile.fileName,
						traceMap: nodeSourceMap ? new TraceMap(nodeSourceMap) : undefined,
					}).start);
			}
			ts.forEachChild(childNode, findIconCallExpression);
		};

		// When the renderer is a separate module we can say with some certainty that the .icon() call
		// is a RenderManager's
		if (rendererSource.fileName !== this.#sourceFile.fileName) {
			ts.forEachChild(rendererSource, findIconCallExpression);
		} else {
			// When the renderer is embedded in the control file, then we can analyze only the icon call
			// within the render method.
			ts.forEachChild(renderMethodNode, findIconCallExpression);
		}
	}

	analyzeMetadataProperty(type: string, node: ts.PropertyAssignment) {
		const analyzeMetadataDone = taskStart(`analyzeMetadataProperty: ${type}`, this.#resourcePath, true);
		if (type === "interfaces") {
			const deprecatedInterfaces = this.#apiExtract.deprecations.interfaces;

			if (ts.isArrayLiteralExpression(node.initializer)) {
				node.initializer.elements.forEach((elem) => {
					const interfaceName = (elem as ts.StringLiteral).text;

					if (deprecatedInterfaces[interfaceName]) {
						this.#reporter.addMessage(MESSAGE.DEPRECATED_INTERFACE, {
							interfaceName: interfaceName,
							details: deprecatedInterfaces[interfaceName],
						}, elem);
					}
				});
			}
		} else if (type === "altTypes" && ts.isArrayLiteralExpression(node.initializer)) {
			const deprecatedTypes = {
				...this.#apiExtract.deprecations.enums,
				...this.#apiExtract.deprecations.typedefs,
			};
			node.initializer.elements.forEach((element) => {
				const nodeType = ts.isStringLiteral(element) ? element.text : "";

				if (deprecatedTypes[nodeType]) {
					this.#reporter.addMessage(MESSAGE.DEPRECATED_TYPE, {
						typeName: nodeType,
						details: deprecatedTypes[nodeType],
					}, element);
				}
			});
		} else if (type === "defaultValue") {
			const deprecatedTypes = {
				...this.#apiExtract.deprecations.enums,
				...this.#apiExtract.deprecations.typedefs,
			};
			const defaultValueType = ts.isStringLiteral(node.initializer) ?
				node.initializer.text :
				"";

			const typeNode = node.parent.properties.find((prop) => {
				return ts.isPropertyAssignment(prop) && prop.name.getText() === "type";
			});

			const fullyQuantifiedName = (typeNode &&
				ts.isPropertyAssignment(typeNode) &&
				ts.isStringLiteral(typeNode.initializer)) ?
					[typeNode.initializer.text, defaultValueType].join(".") :
				"";

			if (deprecatedTypes[fullyQuantifiedName]) {
				this.#reporter.addMessage(MESSAGE.DEPRECATED_TYPE, {
					typeName: defaultValueType,
					details: deprecatedTypes[fullyQuantifiedName],
				}, node);
			}
		// This one is too generic and should always be at the last place
		// It's for "types" and event arguments' types
		} else if (ts.isStringLiteral(node.initializer)) {
			const deprecatedTypes = {
				...this.#apiExtract.deprecations.enums,
				...this.#apiExtract.deprecations.typedefs,
			} as Record<string, string>;

			// Strip all the complex type definitions and create a list of "simple" types
			// i.e. Record<string, Map<my.custom.type, Record<another.type, number[]>>>
			// -> string, my.custom.type, another.type, number
			const nodeTypes = node.initializer.text.replace(/\w+<|>|\[\]/gi, "")
				.split(",").map((type) => type.trim());

			nodeTypes.forEach((nodeType) => {
				if (this.#apiExtract.deprecations.classes[nodeType]) {
					this.#reporter.addMessage(MESSAGE.DEPRECATED_CLASS, {
						className: nodeType,
						details: this.#apiExtract.deprecations.classes[nodeType],
					}, node.initializer);
				} else if (deprecatedTypes[nodeType]) {
					this.#reporter.addMessage(MESSAGE.DEPRECATED_TYPE, {
						typeName: nodeType,
						details: deprecatedTypes[nodeType],
					}, node.initializer);
				}
			});
		}
		analyzeMetadataDone();
	}

	analyzeIdentifier(node: ts.Identifier) {
		const type = this.#checker.getTypeAtLocation(node);
		if (!type?.symbol || !this.isSymbolOfUi5OrThirdPartyType(type.symbol)) {
			return;
		}
		const deprecationInfo = this.getDeprecationInfo(type.symbol);
		if (deprecationInfo) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_API_ACCESS, {
				apiName: node.text,
				details: deprecationInfo.messageDetails,
			}, node);
		}
	}

	analyzeImportSpecifier(node: ts.ImportSpecifier) {
		const type = this.#checker.getTypeAtLocation(node);
		if (!type?.symbol || !this.isSymbolOfUi5OrThirdPartyType(type.symbol)) {
			return;
		}
		const deprecationInfo = this.getDeprecationInfo(type.symbol);
		if (deprecationInfo) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_API_ACCESS, {
				apiName: node.getText(),
				details: deprecationInfo.messageDetails,
			}, node);
		}
	}

	analyzeObjectBindingPattern(node: ts.ObjectBindingPattern) {
		node.elements.forEach((element) => {
			if (element.kind === ts.SyntaxKind.BindingElement &&
				element.name.kind === ts.SyntaxKind.Identifier) {
				this.analyzeIdentifier(element.name);
			}
			// Currently this lacks support for handling nested destructuring, e.g.
			//   `const { SomeObject: { SomeOtherObject } } = coreLib;`
			// Also not covered is destructuring with computed property names, e.g.
			//   const propName = "SomeObject"
			//   const {[propName]: SomeVar} = coreLib;
			// Neither is expected to be relevant in the context of UI5 API usage.
		});
	}

	analyzeObjectLiteralExpression(node: ts.ObjectLiteralExpression) {
		node.properties.forEach((prop) => {
			if (prop.kind === ts.SyntaxKind.ShorthandPropertyAssignment) {
				this.analyzeIdentifier(prop.name);
			} else if (prop.kind === ts.SyntaxKind.PropertyAssignment) {
				this.analyzeIdentifier(prop.name as ts.Identifier);
			}
		});
	}

	analyzeNewExpression(node: ts.NewExpression) {
		const nodeType = this.#checker.getTypeAtLocation(node); // checker.getContextualType(node);
		if (!nodeType.symbol || !this.isSymbolOfUi5OrThirdPartyType(nodeType.symbol)) {
			return;
		}
		const classType = this.#checker.getTypeAtLocation(node.expression);

		const moduleDeclaration = this.getSymbolModuleDeclaration(nodeType.symbol);
		if (moduleDeclaration?.name.text === "sap/ui/core/routing/Router") {
			this.#analyzeNewCoreRouter(node);
		} else if (moduleDeclaration?.name.text === "sap/ui/model/odata/v4/ODataModel") {
			this.#analyzeNewOdataModelV4(node);
		}

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
								this.#reporter.addMessage(MESSAGE.DEPRECATED_PROPERTY_OF_CLASS,
									{
										propertyName: propertySymbol.escapedName as string,
										className: this.#checker.typeToString(nodeType),
										details: deprecationInfo.messageDetails,
									},
									prop
								);
							}
						}
					}
				});
			}
		});
	}

	extractNamespace(node: ts.PropertyAccessExpression | ts.ElementAccessExpression): string {
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
					symbol, messageDetails: "",
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

		if (!ts.isPropertyAccessExpression(exprNode) && // Lib.init()
			!ts.isElementAccessExpression(exprNode) && // Lib["init"]()
			!ts.isIdentifier(exprNode) && // Assignment `const LibInit = Library.init` and destructuring
			!ts.isCallExpression(exprNode)) {
			// TODO: Transform into coverage message if it's really ok not to handle this
			throw new Error(`Unhandled CallExpression expression syntax: ${ts.SyntaxKind[exprNode.kind]}`);
		}

		const moduleDeclaration = this.getSymbolModuleDeclaration(exprType.symbol);
		if (exprType.symbol && moduleDeclaration) {
			const symbolName = exprType.symbol.getName();
			const moduleName = moduleDeclaration.name.text;

			if (symbolName === "init" && moduleName === "sap/ui/core/Lib") {
				// Check for sap/ui/core/Lib.init usages
				this.#analyzeLibInitCall(node, exprNode);
			} else if (symbolName === "get" && moduleName === "sap/ui/core/theming/Parameters") {
				this.#analyzeParametersGetCall(node);
			} else if (symbolName === "createComponent" && moduleName === "sap/ui/core/Component") {
				this.#analyzeCreateComponentCall(node);
			} else if (symbolName === "loadData" && moduleName === "sap/ui/model/json/JSONModel") {
				this.#analyzeJsonModelLoadDataCall(node);
			} else if (symbolName === "createEntry" && moduleName === "sap/ui/model/odata/v2/ODataModel") {
				this.#analyzeOdataModelV2CreateEntry(node);
			} else if (symbolName === "init" && moduleName === "sap/ui/util/Mobile") {
				this.#analyzeMobileInit(node);
			}
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
		} else { // Identifier / CallExpression
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
				additionalMessage = `of class '${this.#checker.typeToString(lhsExprType)}'`;
			} else if (ts.isCallExpression(lhsExpr)) {
				// left-hand-side is a function call, e.g. "function().deprecatedMethod()"
				// Use the (return) type of that function call
				additionalMessage = `of module '${this.#checker.typeToString(lhsExprType)}'`;
			} else if (ts.isPropertyAccessExpression(exprNode)) {
				// left-hand-side is a module or namespace, e.g. "module.deprecatedMethod()"
				additionalMessage = `(${this.extractNamespace(exprNode)})`;
			}
		}

		this.#reporter.addMessage(MESSAGE.DEPRECATED_FUNCTION_CALL, {
			functionName: getPropertyName(reportNode),
			additionalMessage,
			details: deprecationInfo.messageDetails,
		}, reportNode);
	}

	getSymbolModuleDeclaration(symbol: ts.Symbol) {
		let parent = symbol.valueDeclaration?.parent;
		while (parent && !ts.isModuleDeclaration(parent)) {
			parent = parent.parent;
		}
		return parent;
	}

	#analyzeLibInitCall(
		node: ts.CallExpression,
		exprNode: ts.CallExpression | ts.ElementAccessExpression | ts.PropertyAccessExpression | ts.Identifier) {
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
			if (ts.isIdentifier(exprNode)) {
				importedVarName = exprNode.getText();
			} else {
				importedVarName = exprNode.expression.getText() + ".init";
			}

			this.#reporter.addMessage(MESSAGE.LIB_INIT_API_VERSION, {
				libInitFunction: importedVarName,
			}, nodeToHighlight);
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
			if (!ts.isStringLiteral(dependency)) {
				// We won't be interested if the elements of the Array are not of type
				// StringLiteral, so we ignore such cases here (if such at all).
				return;
			}

			const curLibName = dependency.text;

			if (deprecatedLibraries.includes(curLibName)) {
				this.#reporter.addMessage(MESSAGE.DEPRECATED_LIBRARY, {
					libraryName: curLibName,
				}, dependency);
			}
		});
	}

	#analyzeParametersGetCall(node: ts.CallExpression) {
		if (node.arguments.length && ts.isObjectLiteralExpression(node.arguments[0])) {
			// Non-deprecated usage
			return;
		}

		this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_PARAMETERS_GET, node);
	}

	#analyzeCreateComponentCall(node: ts.CallExpression) {
		if (!node.arguments.length || !ts.isObjectLiteralExpression(node.arguments[0])) {
			return;
		}
		const firstArg = node.arguments[0];
		let asyncFalseNode;
		for (const prop of firstArg.properties) {
			if (!ts.isPropertyAssignment(prop)) {
				continue;
			}
			if (prop.name.getText() !== "async") {
				continue;
			}
			if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
				asyncFalseNode = prop;
				break;
			}
		}

		if (asyncFalseNode) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_CREATE_COMPONENT, asyncFalseNode);
		}
	}

	#analyzeOdataModelV2CreateEntry(node: ts.CallExpression) {
		if (!node.arguments.length || node.arguments.length < 2 || !ts.isObjectLiteralExpression(node.arguments[1])) {
			return;
		}
		const secondArg = node.arguments[1];
		let batchGroupId;
		let properties;
		for (const prop of secondArg.properties) {
			if (!ts.isPropertyAssignment(prop)) {
				continue;
			}
			if (prop.name.getText() === "batchGroupId") {
				batchGroupId = prop;
			}
			if (prop.name.getText() === "properties") {
				properties = prop;
			}
		}

		if (batchGroupId) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY, batchGroupId);
		}
		if (properties && ts.isArrayLiteralExpression(properties.initializer)) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_ODATA_MODEL_V2_CREATE_ENTRY_PROPERTIES_ARRAY,
				properties);
		}
	}

	#analyzeJsonModelLoadDataCall(node: ts.CallExpression) {
		if (!node.arguments.length || node.arguments.length < 3) {
			return;
		}

		const asyncArg = node.arguments[2];
		if (asyncArg.kind === ts.SyntaxKind.FalseKeyword) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_JSON_MODEL_LOAD_DATA, {
				paramName: "bAsync",
			}, asyncArg);
		}

		if (node.arguments.length < 6) {
			return;
		}
		const cacheArg = node.arguments[5];
		if (cacheArg.kind === ts.SyntaxKind.FalseKeyword) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_JSON_MODEL_LOAD_DATA, {
				paramName: "bCache",
			}, cacheArg);
		}
	}

	#analyzeMobileInit(node: ts.CallExpression) {
		if (!node.arguments.length || !ts.isObjectLiteralExpression(node.arguments[0])) {
			return;
		}
		const configArg = node.arguments[0];
		let homeIconArg;
		let homeIconPrecomposedArg;
		for (const prop of configArg.properties) {
			if (!ts.isPropertyAssignment(prop)) {
				continue;
			}
			const propName = prop.name.getText();
			if (propName === "homeIcon") {
				homeIconArg = prop;
			} else if (propName === "homeIconPrecomposed") {
				homeIconPrecomposedArg = prop;
			}
		}

		if (homeIconArg) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_MOBILE_INIT, {
				paramName: "homeIcon",
			}, homeIconArg);
		}
		if (homeIconPrecomposedArg) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_MOBILE_INIT, {
				paramName: "homeIconPrecomposed",
			}, homeIconPrecomposedArg);
		}
	}

	#analyzeNewCoreRouter(node: ts.NewExpression) {
		if (!node.arguments || node.arguments.length < 2 || !ts.isObjectLiteralExpression(node.arguments[1])) {
			return;
		}

		const configArg = node.arguments[1];

		let asyncProb;
		for (const prop of configArg.properties) {
			if (!ts.isPropertyAssignment(prop)) {
				continue;
			}
			if (prop.name.getText() === "async") {
				asyncProb = prop;
				break;
			}
		}

		if (!asyncProb || asyncProb.initializer.kind !== ts.SyntaxKind.TrueKeyword) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_CORE_ROUTER, node);
		}
	}

	#analyzeNewOdataModelV4(node: ts.NewExpression) {
		if (!node.arguments || node.arguments.length < 1 || !ts.isObjectLiteralExpression(node.arguments[0])) {
			return;
		}

		const configArg = node.arguments[0];

		let synchronizationModeProb;
		for (const prop of configArg.properties) {
			if (!ts.isPropertyAssignment(prop)) {
				continue;
			}
			if (prop.name.getText() === "synchronizationMode") {
				synchronizationModeProb = prop;
				break;
			}
		}

		if (synchronizationModeProb) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_ODATA_MODEL_V4_SYNCHRONIZATION_MODE, synchronizationModeProb);
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
				this.#reporter.addMessage(MESSAGE.DEPRECATED_API_ACCESS, {
					apiName: namespace ?? "jQuery.sap",
					details: deprecationInfo.messageDetails,
				}, node);
			} else {
				this.#reporter.addMessage(MESSAGE.DEPRECATED_PROPERTY, {
					propertyName: deprecationInfo.symbol.escapedName as string,
					details: deprecationInfo.messageDetails,
				}, node);
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
				!((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
					this.isAllowedPropertyAccess(node))) {
				this.#reporter.addMessage(MESSAGE.NO_GLOBALS, {
					variableName: symbol.getName(),
					namespace: this.extractNamespace((node as ts.PropertyAccessExpression)),
				}, node);
			}
		}
	}

	isAllowedPropertyAccess(node: ts.PropertyAccessExpression | ts.ElementAccessExpression): boolean {
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
		if (!symbol) {
			return;
		}
		// Only check for the "default" export regardless of what's declared
		// as UI5 / AMD only supports importing the default anyways.
		// TODO: This needs to be enhanced in future
		const defaultExportSymbol = symbol.exports?.get("default" as ts.__String);
		const deprecationInfo = this.getDeprecationInfo(defaultExportSymbol);
		if (deprecationInfo) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_MODULE_IMPORT, {
				moduleName: moduleSpecifierNode.text,
				details: deprecationInfo.messageDetails,
			}, moduleSpecifierNode);
		}

		if (this.isSymbolOfPseudoModuleType(symbol)) {
			const moduleNamespaceName = moduleSpecifierNode.text.replaceAll("/", ".");
			const isDataType = !!this.#dataTypes[moduleNamespaceName];
			if (isDataType) {
				this.#reporter.addMessage(
					MESSAGE.NO_DIRECT_DATATYPE_ACCESS,
					{moduleName: moduleSpecifierNode.text},
					moduleSpecifierNode
				);
			} else { // Enum
				this.#reporter.addMessage(
					MESSAGE.NO_DIRECT_ENUM_ACCESS,
					{moduleName: moduleSpecifierNode.text},
					moduleSpecifierNode
				);
			}
		}
	}

	isSymbolOfUi5Type(symbol: ts.Symbol) {
		return this.checkSymbolDeclarationSourceFile(symbol, isSourceFileOfUi5Type);
	}

	isSymbolOfUi5OrThirdPartyType(symbol: ts.Symbol) {
		return this.checkSymbolDeclarationSourceFile(symbol, isSourceFileOfUi5OrThirdPartyType);
	}

	isSymbolOfJquerySapType(symbol: ts.Symbol) {
		return this.checkSymbolDeclarationSourceFile(symbol, isSourceFileOfJquerySapType);
	}

	isSymbolOfPseudoModuleType(symbol: ts.Symbol) {
		return this.checkSymbolDeclarationSourceFile(symbol, isSourceFileOfPseudoModuleType);
	}

	checkSymbolDeclarationSourceFile(
		symbol: ts.Symbol, checkFunction: (sourceFile: ts.SourceFile) => boolean
	) {
		const declarations = symbol.getDeclarations();
		if (!declarations) {
			return false;
		}
		// First check if any declaration is from the TypeScript lib and if so, return false in order to never process
		// such symbols (e.g. globals like 'Symbol', which might have dedicated types in UI5 thirdparty like JQuery)
		return !declarations.some((declaration) => isSourceFileOfTypeScriptLib(declaration.getSourceFile())) &&
			declarations.some((declaration) => checkFunction(declaration.getSourceFile()));
	}
}
