import ts from "typescript";
import path from "node:path/posix";
import {getLogger} from "@ui5/logger";
import SourceFileReporter from "./SourceFileReporter.js";
import LinterContext, {ResourcePath, CoverageCategory} from "../LinterContext.js";
import {MESSAGE} from "../messages.js";
import analyzeComponentJson from "./asyncComponentFlags.js";
import {deprecatedLibraries, deprecatedThemes} from "../../utils/deprecations.js";
import {
	getPropertyNameText,
	getSymbolForPropertyInConstructSignatures,
	getPropertyAssignmentInObjectLiteralExpression,
	getPropertyAssignmentsInObjectLiteralExpression,
	findClassMember,
	isClassMethod,
} from "./utils.js";
import {taskStart} from "../../utils/perf.js";
import {getPositionsForNode} from "../../utils/nodePosition.js";
import {TraceMap} from "@jridgewell/trace-mapping";
import type {ApiExtract} from "../../utils/ApiExtract.js";
import {findDirectives} from "./directives.js";

const log = getLogger("linter:ui5Types:SourceFileLinter");

const QUNIT_FILE_EXTENSION = /\.qunit\.(js|ts)$/;

// This is the same check as in the framework and prevents false-positives
// https://github.com/SAP/openui5/blob/32c21c33d9dc29a32bf7ee7f41d7bae23dcf086b/src/sap.ui.core/src/sap/ui/test/starter/_utils.js#L287
const VALID_TESTSUITE = /^\/testsuite(?:\.[a-z][a-z0-9-]*)*\.qunit\.(?:js|ts)$/;

const DEPRECATED_VIEW_TYPES = ["JS", "JSON", "HTML", "Template"];

const ALLOWED_RENDERER_API_VERSIONS = ["2", "4"];

interface DeprecationInfo {
	symbol: ts.Symbol;
	messageDetails: string;
}

function isSourceFileOfUi5Type(sourceFile: ts.SourceFile) {
	return /\/types\/(@openui5|@sapui5|@ui5\/linter\/overrides)\//.test(sourceFile.fileName);
}

function isSourceFileOfUi5OrThirdPartyType(sourceFile: ts.SourceFile) {
	return isSourceFileOfUi5Type(sourceFile) || /\/types\/(@types\/jquery)\//.test(sourceFile.fileName);
}

function isSourceFileOfJquerySapType(sourceFile: ts.SourceFile) {
	return sourceFile.fileName === "/types/@ui5/linter/overrides/jquery.sap.d.ts";
}

function isSourceFileOfPseudoModuleType(sourceFile: ts.SourceFile) {
	return sourceFile.fileName.startsWith("/types/@ui5/linter/overrides/pseudo-modules/");
}

function isSourceFileOfTypeScriptLib(sourceFile: ts.SourceFile) {
	return sourceFile.fileName.startsWith("/types/typescript/lib/");
}

export default class SourceFileLinter {
	#reporter: SourceFileReporter;
	#boundVisitNode: (node: ts.Node) => void;
	#fileName: string;
	#isComponent: boolean;
	#hasTestStarterFindings: boolean;

	constructor(
		private context: LinterContext,
		private resourcePath: ResourcePath,
		private sourceFile: ts.SourceFile,
		private sourceMaps: Map<string, string> | undefined,
		private checker: ts.TypeChecker,
		private reportCoverage = false,
		private messageDetails = false,
		private apiExtract: ApiExtract,
		private manifestContent?: string
	) {
		this.#reporter = new SourceFileReporter(context, resourcePath,
			sourceFile, sourceMaps?.get(sourceFile.fileName));
		this.#boundVisitNode = this.visitNode.bind(this);
		this.#fileName = path.basename(resourcePath);
		this.#isComponent = this.#fileName === "Component.js" || this.#fileName === "Component.ts";
		this.#hasTestStarterFindings = false;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async lint() {
		try {
			const metadata = this.context.getMetadata(this.resourcePath);
			if (!metadata.directives) {
				// Directives might have already been extracted by the amd transpiler
				// This is done since the transpile process might loose comments
				findDirectives(this.sourceFile, metadata);
			}
			this.visitNode(this.sourceFile);

			if (this.sourceFile.fileName.endsWith(".qunit.js") && // TS files do not have sap.ui.define
				!metadata?.transformedImports?.get("sap.ui.define")) {
				this.#reportTestStarter(this.sourceFile);
			}

			this.#reporter.deduplicateMessages();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			log.verbose(`Error while linting ${this.resourcePath}: ${message}`);
			if (err instanceof Error) {
				log.verbose(`Call stack: ${err.stack}`);
			}
			this.context.addLintingMessage(this.resourcePath, MESSAGE.PARSING_ERROR, {message});
		}
	}

	visitNode(node: ts.Node) {
		if (node.kind === ts.SyntaxKind.NewExpression) { // e.g. "new Button({\n\t\t\t\tblocked: true\n\t\t\t})"
			this.analyzeNewExpression(node as ts.NewExpression);
		} else if (node.kind === ts.SyntaxKind.CallExpression) { // ts.isCallLikeExpression too?
			// const nodeType = this.checker.getTypeAtLocation(node);
			this.analyzePropertyAccessExpression(node as ts.CallExpression); // Check for global
			this.analyzeCallExpression(node as ts.CallExpression); // Check for deprecation
		} else if (node.kind === ts.SyntaxKind.PropertyAccessExpression ||
			node.kind === ts.SyntaxKind.ElementAccessExpression) {
			// First, check for deprecation
			const deprecationMessageReported = this.analyzePropertyAccessExpressionForDeprecation(
				node as (ts.PropertyAccessExpression | ts.ElementAccessExpression));

			// If not deprecated, check for global.
			// We prefer the deprecation message over the global one as it contains more information.
			if (!deprecationMessageReported) {
				this.analyzePropertyAccessExpression(
					node as (ts.PropertyAccessExpression | ts.ElementAccessExpression)); // Check for global
			}

			this.analyzeExportedValuesByLib(node as (ts.PropertyAccessExpression | ts.ElementAccessExpression));
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
				manifestContent: this.manifestContent,
				resourcePath: this.resourcePath,
				reporter: this.#reporter,
				context: this.context,
				checker: this.checker,
				isUiComponent: this.isUi5ClassDeclaration(node, "sap/ui/core/UIComponent"),
			});
		} else if (
			ts.isPropertyDeclaration(node) &&
			getPropertyNameText(node.name) === "metadata" &&
			node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
			this.isUi5ClassDeclaration(node.parent, "sap/ui/base/ManagedObject")
		) {
			const visitMetadataNodes = (childNode: ts.Node) => {
				if (ts.isPropertyAssignment(childNode)) { // Skip nodes out of interest
					this.analyzeMetadataProperty(childNode);
				}

				ts.forEachChild(childNode, visitMetadataNodes);
			};
			ts.forEachChild(node, visitMetadataNodes);
		} else if (this.isUi5ClassDeclaration(node, "sap/ui/core/Control")) {
			this.analyzeControlRendererDeclaration(node);
			this.analyzeControlRerenderMethod(node);
		} else if (ts.isPropertyAssignment(node) && getPropertyNameText(node.name) === "theme") {
			this.analyzeTestsuiteThemeProperty(node);
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
					const parentClassType = this.checker.getTypeAtLocation(parentClass);

					return parentClassType.symbol?.declarations?.some((declaration) => {
						if (!ts.isClassDeclaration(declaration)) {
							return false;
						}
						for (const baseClass of baseClasses) {
							if (declaration.name?.text === baseClass.name &&
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
		const className = node.name?.text ?? "<unknown>";
		const rendererMember = findClassMember(node, "renderer", [{modifier: ts.SyntaxKind.StaticKeyword}]);

		if (!rendererMember) {
			const nonStaticRender = findClassMember(node, "renderer");
			if (nonStaticRender) {
				// Renderer must be a static member
				this.#reporter.addMessage(MESSAGE.NOT_STATIC_CONTROL_RENDERER, {className}, nonStaticRender);
				return;
			}

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
			const initializerType = this.checker.getTypeAtLocation(rendererMember.initializer);

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
				const {symbol} = this.checker.getTypeAtLocation(rendererMember);

				const originalDeclarations = symbol?.getDeclarations()?.filter((decl) =>
					!decl.getSourceFile().isDeclarationFile);

				// If the original raw render file is available, we can analyze it directly
				originalDeclarations?.forEach((declaration) => this.analyzeControlRendererInternals(declaration));
			} else {
				// Analyze renderer property when it's directly embedded in the renderer object
				// i.e. { renderer: {apiVersion: 2, render: () => {}} }
				this.analyzeControlRendererInternals(rendererMember.initializer);
			}
		}
	}

	analyzeControlRendererInternals(node: ts.Node) {
		const findApiVersionNode = (potentialApiVersionNode: ts.Node) => {
			// const myControlRenderer = {apiVersion: 2, render: () => {}}

			if (ts.isObjectLiteralExpression(potentialApiVersionNode)) {
				const foundNode = getPropertyAssignmentInObjectLiteralExpression("apiVersion", potentialApiVersionNode);
				if (foundNode) {
					return foundNode;
				}
			}

			// const myControlRenderer = {}
			// const myControlRenderer.apiVersion = 2;
			let rendererObjectName = null;
			if ((ts.isPropertyAssignment(potentialApiVersionNode.parent) ||
				ts.isPropertyDeclaration(potentialApiVersionNode.parent) ||
				ts.isVariableDeclaration(potentialApiVersionNode.parent)) &&
				ts.isIdentifier(potentialApiVersionNode.parent.name)) {
				rendererObjectName = potentialApiVersionNode.parent.name.text;
			}

			let apiVersionNode: ts.Expression | undefined;

			const visitChildNodes = (childNode: ts.Node) => {
				if (ts.isBinaryExpression(childNode)) {
					if (ts.isPropertyAccessExpression(childNode.left)) {
						let objectName;
						if (ts.isIdentifier(childNode.left.expression)) {
							objectName = childNode.left.expression.text; // myControlRenderer
						}
						let propertyName;
						if (ts.isIdentifier(childNode.left.name)) {
							propertyName = childNode.left.name.text; // apiVersion
						}
						if (objectName === rendererObjectName && propertyName === "apiVersion") {
							apiVersionNode = childNode.right;
						}
					}
				}

				if (!apiVersionNode) { // If found, stop traversing
					ts.forEachChild(childNode, visitChildNodes);
				}
			};

			ts.forEachChild(potentialApiVersionNode.getSourceFile(), visitChildNodes);

			return apiVersionNode;
		};

		const getNodeToHighlight = (apiVersionNode: ts.Node | undefined) => {
			if (!apiVersionNode) { // No 'apiVersion' property
				return node;
			}
			if (ts.isPropertyAssignment(apiVersionNode)) {
				apiVersionNode = apiVersionNode.initializer;
			}
			if (!ts.isNumericLiteral(apiVersionNode)) {
				return apiVersionNode;
			}
			if (!ALLOWED_RENDERER_API_VERSIONS.includes(apiVersionNode.text)) {
				return apiVersionNode;
			}
			return undefined;
		};

		const nodeType = this.checker.getTypeAtLocation(node);
		const nodeValueDeclaration = nodeType.getSymbol()?.valueDeclaration;

		// Analyze renderer property when it's an ObjectLiteralExpression
		// i.e. { renderer: {apiVersion: 2, render: () => {}} }
		if (node && (ts.isObjectLiteralExpression(node) || ts.isVariableDeclaration(node))) {
			const apiVersionNode = findApiVersionNode(node);
			const nodeToHighlight = getNodeToHighlight(apiVersionNode);
			if (nodeToHighlight) {
				// reporter.addMessage() won't work in this case as it's bound to the current analyzed file.
				// The findings can be in different file i.e. Control being analyzed,
				// but reporting might be in ControlRenderer
				const nodeSourceFile = nodeToHighlight.getSourceFile();
				const nodeSourceMap = this.sourceMaps?.get(nodeSourceFile.fileName);
				this.context.addLintingMessage(
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
			ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || (
			nodeValueDeclaration && (
				ts.isFunctionExpression(nodeValueDeclaration) ||
				ts.isFunctionDeclaration(nodeValueDeclaration) ||
				ts.isArrowFunction(nodeValueDeclaration)
			)
		)) {
			// reporter.addMessage() won't work in this case as it's bound to the current analyzed file.
			// The findings can be in different file i.e. Control being analyzed,
			// but reporting might be in ControlRenderer
			const nodeSourceFile = node.getSourceFile();
			const nodeSourceMap = this.sourceMaps?.get(nodeSourceFile.fileName);
			this.context.addLintingMessage(
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
			const renderProperty = getPropertyAssignmentInObjectLiteralExpression("render", node);
			renderMethodNode = (renderProperty && ts.isPropertyAssignment(renderProperty)) ?
				renderProperty.initializer :
				undefined;

			// When the renderer is a separate module and the render method is assigned
			// to the renderer object later i.e. myControlRenderer.render = function (oRm, oMyControl) {}
			if (!renderMethodNode) {
				let rendererObjectName = null;
				if ((ts.isPropertyAssignment(node.parent) || ts.isPropertyDeclaration(node.parent) ||
					ts.isVariableDeclaration(node.parent)) && ts.isIdentifier(node.parent.name)) {
					rendererObjectName = node.parent.name.text;
				}

				const findRenderMethod = (childNode: ts.Node) => {
					if (ts.isBinaryExpression(childNode)) {
						if (ts.isPropertyAccessExpression(childNode.left)) {
							let objectName;
							if (ts.isIdentifier(childNode.left.expression)) {
								objectName = childNode.left.expression.text; // myControlRenderer
							}
							let propertyName;
							if (ts.isIdentifier(childNode.left.name)) {
								propertyName = childNode.left.name.text; // render
							}
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
				childNode.expression.name.text === "icon"
			) {
				// reporter.addMessage() won't work in this case as it's bound to the current analyzed file.
				// The findings can be in different file i.e. Control being analyzed,
				// but reporting might be in ControlRenderer
				const nodeSourceFile = childNode.getSourceFile();
				const nodeSourceMap = this.sourceMaps?.get(nodeSourceFile.fileName);
				this.context.addLintingMessage(
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
		if (rendererSource.fileName !== this.sourceFile.fileName) {
			ts.forEachChild(rendererSource, findIconCallExpression);
		} else {
			// When the renderer is embedded in the control file, then we can analyze only the icon call
			// within the render method.
			ts.forEachChild(renderMethodNode, findIconCallExpression);
		}
	}

	analyzeControlRerenderMethod(node: ts.ClassDeclaration) {
		const className = node.name?.text ?? "<unknown>";
		// Search for the rerender instance method
		const rerenderMember = findClassMember(node, "rerender", [{not: true, modifier: ts.SyntaxKind.StaticKeyword}]);
		if (!rerenderMember || !isClassMethod(rerenderMember, this.checker)) {
			return;
		}
		this.#reporter.addMessage(MESSAGE.NO_CONTROL_RERENDER_OVERRIDE, {className}, rerenderMember);
	}

	analyzeMetadataProperty(node: ts.PropertyAssignment) {
		const type = getPropertyNameText(node.name);
		if (!type) {
			return;
		}
		const analyzeMetadataDone = taskStart(`analyzeMetadataProperty: ${type}`, this.resourcePath, true);
		if (type === "interfaces") {
			if (ts.isArrayLiteralExpression(node.initializer)) {
				node.initializer.elements.forEach((elem) => {
					const interfaceName = (elem as ts.StringLiteral).text;
					const deprecationInfo = this.apiExtract.getDeprecationInfo(interfaceName);
					if (deprecationInfo) {
						this.#reporter.addMessage(MESSAGE.DEPRECATED_INTERFACE, {
							interfaceName: interfaceName,
							details: deprecationInfo.text,
						}, elem);
					}
				});
			}
		} else if (type === "altTypes" && ts.isArrayLiteralExpression(node.initializer)) {
			node.initializer.elements.forEach((element) => {
				const nodeType = ts.isStringLiteralLike(element) ? element.text : "";
				const deprecationInfo = this.apiExtract.getDeprecationInfo(nodeType);
				if (deprecationInfo) {
					this.#reporter.addMessage(MESSAGE.DEPRECATED_TYPE, {
						typeName: nodeType,
						details: deprecationInfo.text,
					}, element);
				}
			});
		} else if (type === "defaultValue") {
			const defaultValueType = ts.isStringLiteralLike(node.initializer) ?
				node.initializer.text :
				"";

			const typeNode = getPropertyAssignmentInObjectLiteralExpression("type", node.parent);

			const fullyQuantifiedName = (typeNode &&
				ts.isPropertyAssignment(typeNode) &&
				ts.isStringLiteralLike(typeNode.initializer)) ?
					[typeNode.initializer.text, defaultValueType].join(".") :
				"";
			const deprecationInfo = this.apiExtract.getDeprecationInfo(fullyQuantifiedName);
			if (deprecationInfo) {
				this.#reporter.addMessage(MESSAGE.DEPRECATED_TYPE, {
					typeName: defaultValueType,
					details: deprecationInfo.text,
				}, node);
			}
		// This one is too generic and should always be at the last place
		// It's for "types" and event arguments' types
		} else if (ts.isStringLiteralLike(node.initializer)) {
			// Strip all the complex type definitions and create a list of "simple" types
			// i.e. Record<string, Map<my.custom.type, Record<another.type, number[]>>>
			// -> string, my.custom.type, another.type, number
			const nodeTypes = node.initializer.text.replace(/\w+<|>|\[\]/gi, "")
				.split(",").map((type) => type.trim());

			nodeTypes.forEach((nodeType) => {
				const deprecationInfo = this.apiExtract.getDeprecationInfo(nodeType);
				if (deprecationInfo?.symbolKind === "UI5Class") {
					this.#reporter.addMessage(MESSAGE.DEPRECATED_CLASS, {
						className: nodeType,
						details: deprecationInfo.text,
					}, node.initializer);
				} else if (deprecationInfo?.symbolKind === "UI5Typedef" || deprecationInfo?.symbolKind === "UI5Enum") {
					this.#reporter.addMessage(MESSAGE.DEPRECATED_TYPE, {
						typeName: nodeType,
						details: deprecationInfo.text,
					}, node.initializer);
				}
			});
		}
		analyzeMetadataDone();
	}

	analyzeIdentifier(node: ts.Identifier) {
		const type = this.checker.getTypeAtLocation(node);
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
		const type = this.checker.getTypeAtLocation(node);
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
		if (this.hasQUnitFileExtension() &&
			((ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "jsUnitTestSuite") ||
				(ts.isIdentifier(node.expression) && node.expression.text === "jsUnitTestSuite")
			)) {
			this.#reportTestStarter(node);
		}

		const nodeType = this.checker.getTypeAtLocation(node); // checker.getContextualType(node);
		if (!nodeType.symbol || !this.isSymbolOfUi5OrThirdPartyType(nodeType.symbol)) {
			return;
		}
		const classType = this.checker.getTypeAtLocation(node.expression);

		const moduleDeclaration = this.getSymbolModuleDeclaration(nodeType.symbol);
		if (moduleDeclaration?.name.text === "sap/ui/core/routing/Router") {
			this.#analyzeNewCoreRouter(node);
		} else if (moduleDeclaration?.name.text === "sap/ui/model/odata/v4/ODataModel") {
			this.#analyzeNewOdataModelV4(node);
		}

		if (!node.arguments?.length) {
			// Nothing to check
			return;
		}

		// There can be multiple and we need to find the right one
		const allConstructSignatures = classType.getConstructSignatures();
		// We can ignore all signatures that have a different number of parameters
		const possibleConstructSignatures = allConstructSignatures.filter((constructSignature) => {
			return constructSignature.getParameters().length === node.arguments?.length;
		});

		node.arguments.forEach((arg, argIdx) => {
			// Only handle object literals, ignoring the optional first id argument or other unrelated arguments
			if (!ts.isObjectLiteralExpression(arg)) {
				return;
			}
			arg.properties.forEach((prop) => {
				if (!ts.isPropertyAssignment(prop)) {
					return;
				}
				const propertyName = getPropertyNameText(prop.name);
				if (!propertyName) {
					return;
				}
				const propertySymbol = getSymbolForPropertyInConstructSignatures(
					possibleConstructSignatures, argIdx, propertyName
				);
				if (!propertySymbol) {
					return;
				}
				const deprecationInfo = this.getDeprecationInfo(propertySymbol);
				if (!deprecationInfo) {
					return;
				}
				this.#reporter.addMessage(MESSAGE.DEPRECATED_PROPERTY_OF_CLASS,
					{
						propertyName: propertySymbol.escapedName as string,
						className: this.checker.typeToString(nodeType),
						details: deprecationInfo.messageDetails,
					},
					prop
				);
			});
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
			propAccessChain.push(scanNode.name.text);
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
			const jsdocTags = symbol.getJsDocTags(this.checker);
			const deprecatedTag = jsdocTags.find((tag) => tag.name === "deprecated");
			if (deprecatedTag) {
				const deprecationInfo: DeprecationInfo = {
					symbol, messageDetails: "",
				};
				if (this.messageDetails) {
					deprecationInfo.messageDetails = this.getDeprecationText(deprecatedTag);
				}
				return deprecationInfo;
			}
		}
		return null;
	}

	analyzeCallExpression(node: ts.CallExpression) {
		const exprNode = node.expression;
		const exprType = this.checker.getTypeAtLocation(exprNode);
		if (!exprType?.symbol || !this.isSymbolOfUi5OrThirdPartyType(exprType.symbol)) {
			if (this.reportCoverage) {
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
			} else if (symbolName === "setTheme" && moduleName === "sap/ui/core/Theming") {
				this.#analyzeThemingSetTheme(node);
			} else if (symbolName === "create" && moduleName === "sap/ui/core/mvc/View") {
				this.#analyzeViewCreate(node);
			} else if (
				(symbolName === "load" && moduleName === "sap/ui/core/Fragment") ||
				// Controller#loadFragment calls Fragment.load internally
				(symbolName === "loadFragment" && moduleName === "sap/ui/core/mvc/Controller")
			) {
				this.#analyzeFragmentLoad(node, symbolName);
			} else if (this.hasQUnitFileExtension() &&
				!VALID_TESTSUITE.test(this.sourceFile.fileName) &&
				symbolName === "ready" && moduleName === "sap/ui/core/Core") {
				this.#reportTestStarter(node);
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
			const lhsExprType = this.checker.getTypeAtLocation(lhsExpr);
			if (lhsExprType.isClassOrInterface()) {
				// left-hand-side is an instance of a class, e.g. "instance.deprecatedMethod()"
				additionalMessage = `of class '${this.checker.typeToString(lhsExprType)}'`;
			} else if (ts.isCallExpression(lhsExpr)) {
				// left-hand-side is a function call, e.g. "function().deprecatedMethod()"
				// Use the (return) type of that function call
				additionalMessage = `of module '${this.checker.typeToString(lhsExprType)}'`;
			} else if (ts.isPropertyAccessExpression(exprNode)) {
				// left-hand-side is a module or namespace, e.g. "module.deprecatedMethod()"
				additionalMessage = `(${this.extractNamespace(exprNode)})`;
			}
		}

		let propName;
		if (ts.isPropertyName(reportNode)) {
			propName = getPropertyNameText(reportNode);
		}
		if (!propName) {
			propName = reportNode.getText();
		}

		this.#reporter.addMessage(MESSAGE.DEPRECATED_FUNCTION_CALL, {
			functionName: propName,
			additionalMessage,
			details: deprecationInfo.messageDetails,
		}, reportNode);

		if (
			propName === "attachInit" && this.hasQUnitFileExtension() &&
			!VALID_TESTSUITE.test(this.sourceFile.fileName)
		) {
			this.#reportTestStarter(reportNode);
		}
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
			const apiVersionNode = getPropertyAssignmentInObjectLiteralExpression("apiVersion", initArg);

			if (!apiVersionNode) { // No arguments or no 'apiVersion' property
				nodeToHighlight = node;
			} else if (
				!ts.isNumericLiteral(apiVersionNode.initializer) || // Must be a number, not a string
				apiVersionNode.initializer.text !== "2"
			) {
				nodeToHighlight = apiVersionNode;
			}
		}

		if (nodeToHighlight) {
			let importedVarName: string;
			if (ts.isIdentifier(exprNode)) {
				importedVarName = exprNode.text;
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
		const dependenciesNode = getPropertyAssignmentInObjectLiteralExpression(
			"dependencies", initArg
		);

		if (!dependenciesNode ||
			!ts.isPropertyAssignment(dependenciesNode) ||
			!ts.isArrayLiteralExpression(dependenciesNode.initializer)) {
			return;
		}

		dependenciesNode.initializer.elements.forEach((dependency) => {
			if (!ts.isStringLiteralLike(dependency)) {
				// We won't be interested if the elements of the Array are not of type
				// StringLiteralLike, so we ignore such cases here (if such at all).
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

	#reportTestStarter(node: ts.Node) {
		if (!this.#hasTestStarterFindings) {
			this.#reporter.addMessage(MESSAGE.PREFER_TEST_STARTER, node);
			this.#hasTestStarterFindings = true;
		}
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

		const asyncNode = getPropertyAssignmentInObjectLiteralExpression(
			"async", node.arguments[0]
		);

		if (asyncNode?.initializer.kind === ts.SyntaxKind.FalseKeyword) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_CREATE_COMPONENT, asyncNode);
		}
	}

	#analyzeOdataModelV2CreateEntry(node: ts.CallExpression) {
		if (!node.arguments.length || node.arguments.length < 2 || !ts.isObjectLiteralExpression(node.arguments[1])) {
			return;
		}

		const [batchGroupId, properties] = getPropertyAssignmentsInObjectLiteralExpression(
			["batchGroupId", "properties"], node.arguments[1]
		);

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

		const [homeIconArg, homeIconPrecomposedArg] = getPropertyAssignmentsInObjectLiteralExpression(
			["homeIcon", "homeIconPrecomposed"], node.arguments[0]
		);

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

	#analyzeThemingSetTheme(node: ts.CallExpression) {
		if (!node.arguments.length || !ts.isStringLiteral(node.arguments[0])) {
			return;
		}
		const themeName = node.arguments[0].text;
		if (deprecatedThemes.includes(themeName)) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_THEME, {
				themeName,
			}, node.arguments[0]);
		}
	}

	#analyzeNewCoreRouter(node: ts.NewExpression) {
		if (!node.arguments || node.arguments.length < 2 || !ts.isObjectLiteralExpression(node.arguments[1])) {
			return;
		}

		const asyncProb = getPropertyAssignmentInObjectLiteralExpression(
			"async", node.arguments[1]
		);

		if (!asyncProb || asyncProb.initializer.kind !== ts.SyntaxKind.TrueKeyword) {
			this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_CORE_ROUTER, node);
		}
	}

	#analyzeNewOdataModelV4(node: ts.NewExpression) {
		if (!node.arguments || node.arguments.length < 1 || !ts.isObjectLiteralExpression(node.arguments[0])) {
			return;
		}

		const synchronizationModeProb = getPropertyAssignmentInObjectLiteralExpression(
			"synchronizationMode", node.arguments[0]
		);

		if (synchronizationModeProb) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_ODATA_MODEL_V4_SYNCHRONIZATION_MODE, synchronizationModeProb);
		}
	}

	#analyzeViewCreate(node: ts.CallExpression) {
		if (!node.arguments?.length || !ts.isObjectLiteralExpression(node.arguments[0])) {
			return;
		}

		// Find "type" property
		const typeProperty = getPropertyAssignmentInObjectLiteralExpression("type", node.arguments[0]);

		if (typeProperty && ts.isStringLiteralLike(typeProperty.initializer)) {
			const typeValue = typeProperty.initializer.text;
			if (DEPRECATED_VIEW_TYPES.includes(typeValue)) {
				this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_VIEW_CREATE, {
					typeValue,
				}, node);
			}
		}
	}

	#analyzeFragmentLoad(node: ts.CallExpression, symbolName: "load" | "loadFragment") {
		// Note: This method is called for:
		// - sap/ui/core/Fragment.load
		// - sap/ui/core/mvc/Controller#loadFragment

		if (!node.arguments?.length || !ts.isObjectLiteralExpression(node.arguments[0])) {
			return;
		}

		// Find "type" property
		const typeProperty = getPropertyAssignmentInObjectLiteralExpression("type", node.arguments[0]);

		if (typeProperty && ts.isStringLiteralLike(typeProperty.initializer)) {
			const typeValue = typeProperty.initializer.text;
			if (typeValue === "HTML") {
				if (symbolName === "load") {
					this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_FRAGMENT_LOAD, {
						typeValue,
					}, node);
				} else {
					this.#reporter.addMessage(MESSAGE.PARTIALLY_DEPRECATED_CONTROLLER_LOAD_FRAGMENT, {
						typeValue,
					}, node);
				}
			}
		}
	}

	getDeprecationInfoForAccess(node: ts.AccessExpression): DeprecationInfo | null {
		let symbol;
		if (ts.isPropertyAccessExpression(node)) {
			symbol = this.checker.getSymbolAtLocation(node.name);
		} else { // ElementAccessExpression
			symbol = this.checker.getSymbolAtLocation(node.argumentExpression);
		}
		return this.getDeprecationInfo(symbol);
	}

	analyzePropertyAccessExpressionForDeprecation(node: ts.AccessExpression): boolean {
		if (ts.isCallExpression(node.parent) && node.parent.expression === node) {
			// If this AccessExpression is the expression of a CallExpression, we can ignore it here.
			// It will be analyzed in context of the CallExpression.
			return false;
		}
		const deprecationInfo = this.getDeprecationInfoForAccess(node);
		if (!deprecationInfo) {
			return false;
		}
		let namespace;
		if (ts.isPropertyAccessExpression(node)) {
			namespace = this.extractNamespace(node);
		}
		if (this.isSymbolOfJquerySapType(deprecationInfo.symbol)) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_API_ACCESS, {
				apiName: namespace ?? "jQuery.sap",
				details: deprecationInfo.messageDetails,
			}, node);
		} else {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_PROPERTY, {
				propertyName: deprecationInfo.symbol.escapedName as string,
				namespace,
				details: deprecationInfo.messageDetails,
			}, node);
		}
		return true;
	}

	handleCallExpressionUnknownType(nodeType: ts.Type, node: ts.CallExpression) {
		const typeString = this.checker.typeToString(nodeType);
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
					`${identifier ? " \"" + identifier.text + "\"" : ""} in "${node.getText()}"" ` +
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

	analyzeExportedValuesByLib(node: ts.PropertyAccessExpression | ts.ElementAccessExpression) {
		if (!ts.isElementAccessExpression(node) &&
			node.name?.kind !== ts.SyntaxKind.Identifier) {
			return;
		}

		const extractVarName = (node: ts.PropertyAccessExpression | ts.ElementAccessExpression) => {
			const nodeName = ts.isPropertyAccessExpression(node) ?
				node.name.text :
					node.argumentExpression.getText();

			return nodeName.replaceAll("\"", "");
		};

		let exprNode = node.expression;
		const namespace: string[] = [];
		while (ts.isPropertyAccessExpression(exprNode) ||
			ts.isElementAccessExpression(exprNode)) {
			namespace.unshift(extractVarName(exprNode));
			exprNode = exprNode.expression;
		}
		const exprType = this.checker.getTypeAtLocation(exprNode);
		const potentialLibImport = exprType.symbol?.getName().replaceAll("\"", "") ?? "";

		// Checks if the left hand side is a library import.
		// It's sufficient just to check for "/library" at the end of the string by convention
		if (!potentialLibImport.endsWith("/library")) {
			return;
		}

		const varName = extractVarName(node);
		const moduleName = [
			potentialLibImport.replace("/library", ""),
			...namespace,
			varName,
		].join("/");

		// Check if the module is registered within ambient modules
		const ambientModules = this.checker.getAmbientModules();
		const libAmbientModule = ambientModules.find((module) =>
			module.name === `"${potentialLibImport}"`);
		const isRegisteredAsUi5Module = ambientModules.some((module) =>
			module.name === `"${moduleName}"`);

		let isModuleExported = true;
		let libExports = libAmbientModule?.exports ?? new Map();
		for (const moduleChunk of [...namespace, varName]) {
			if (!libExports.has(moduleChunk)) {
				isModuleExported = false;
				break;
			}

			const exportMap = libExports.get(moduleChunk) as ts.Symbol | undefined;
			libExports = exportMap?.exports ?? new Map();
		}

		if (isRegisteredAsUi5Module && !isModuleExported) {
			this.#reporter.addMessage(MESSAGE.NO_EXPORTED_VALUES_BY_LIB, {
				module: moduleName,
				namespace: [
					exprNode?.getText(),
					...namespace,
					varName,
				].join("."),
				libraryName: potentialLibImport,
			},
			(ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression));
		}
	}

	analyzePropertyAccessExpression(node: ts.AccessExpression | ts.CallExpression) {
		const exprNode = node.expression;

		if (ts.isIdentifier(exprNode)) {
			// The expression being an identifier indicates that this is the first access
			// in a possible chain. E.g. the "sap" in "sap.ui.getCore()"

			let symbol;

			// Get the NodeType in order to check whether this is indirect global access via Window
			const nodeType = this.checker.getTypeAtLocation(exprNode);
			if (this.isGlobalThis(this.checker.typeToString(nodeType))) {
				// In case of Indirect global access we need to check for
				// a global UI5 variable on the right side of the expression instead of left
				if (ts.isPropertyAccessExpression(node)) {
					symbol = this.checker.getSymbolAtLocation(node.name);
				} else if (ts.isElementAccessExpression(node)) {
					symbol = this.checker.getSymbolAtLocation(node.argumentExpression);
				} else { // Identifier
					symbol = this.checker.getSymbolAtLocation(node);
				}
			} else {
				// No access via Window. Check the left side of the expression
				symbol = this.checker.getSymbolAtLocation(exprNode);
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
		if (["require", "define", "QUnit", "sinon"].includes(node.expression.text)) {
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
		const symbol = this.checker.getSymbolAtLocation(moduleSpecifierNode);
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
			let isEnum = false;
			if (defaultExportSymbol) {
				const declarations = defaultExportSymbol.getDeclarations();
				if (declarations) {
					declarations.forEach((declaration) => {
						if (!ts.isExportAssignment(declaration)) {
							return;
						}
						const type = this.checker.getTypeAtLocation(declaration.expression);
						if (type.symbol?.flags & ts.SymbolFlags.Enum) {
							isEnum = true;
						}
					});
				}
			}
			if (isEnum) {
				this.#reporter.addMessage(
					MESSAGE.NO_DIRECT_ENUM_ACCESS,
					{moduleName: moduleSpecifierNode.text},
					moduleSpecifierNode
				);
			} else { // Data Type
				this.#reporter.addMessage(
					MESSAGE.NO_DIRECT_DATATYPE_ACCESS,
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

	analyzeTestsuiteThemeProperty(node: ts.PropertyAssignment) {
		// Check if the node is part of a testsuite config file by its file name.
		if (!VALID_TESTSUITE.test(node.getSourceFile().fileName)) return;

		// In a Test Starter testsuite file,
		// themes can be defined as default (1.) or for test configs individually (2.).
		// The schema for these files can be found here (under 'The UI5 Test Suite Module'):
		// https://ui5.sap.com/#/topic/22f50c0f0b104bf3ba84620880793d3f

		// (1.) and (2.) are checks for these two possible structures,
		// which use surrounding property names to determine the context
		// and set the flag 'isTestStarterStructure' to true afterwards.
		let isTestStarterStructure = false;

		const oneLayerUp = node.parent?.parent;
		const twoLayersUp = oneLayerUp?.parent?.parent;
		const threeLayersUp = twoLayersUp?.parent?.parent;

		// Check if "theme" property is inside "ui5: {...}" object
		if (oneLayerUp && ts.isObjectLiteralElement(oneLayerUp) &&
			oneLayerUp.name && getPropertyNameText(oneLayerUp.name) === "ui5") {
			if (ts.isObjectLiteralElement(twoLayersUp) &&
				twoLayersUp.name && getPropertyNameText(twoLayersUp.name) === "defaults") {
				// (1.) set flag to true if "theme" property is in "defaults: {...}" context
				isTestStarterStructure = true;
			} else if (ts.isObjectLiteralElement(twoLayersUp) &&
				ts.isObjectLiteralElement(threeLayersUp) &&
				threeLayersUp.name && getPropertyNameText(threeLayersUp.name) === "tests") {
				// (2.) set flag to true if "theme" property is in "tests: {...}" context
				isTestStarterStructure = true;
			}
		}

		if (!ts.isStringLiteralLike(node.initializer)) {
			return;
		}
		const themeName = node.initializer.text;
		if (isTestStarterStructure && deprecatedThemes.includes(themeName)) {
			this.#reporter.addMessage(MESSAGE.DEPRECATED_THEME, {
				themeName,
			}, node);
		}
	}

	hasQUnitFileExtension() {
		return QUNIT_FILE_EXTENSION.test(this.sourceFile.fileName);
	}
}
