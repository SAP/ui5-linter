import ts from "typescript";
import SourceFileReporter from "./SourceFileReporter.js";
import type {JSONSchemaForSAPUI5Namespace, SAPJSONSchemaForWebApplicationManifestFile} from "../../manifest.js";
import LinterContext, {LintMessage, LintMessageSeverity} from "../LinterContext.js";
import jsonMap from "json-source-map";
import type {jsonSourceMapType} from "../manifestJson/ManifestLinter.js";

type propsRecordValueType = string | boolean | undefined | null | number | propsRecord;
type propsRecord = Record<string, {
	value: propsRecordValueType | propsRecordValueType[];
	node?: ts.Node;
}>;

enum AsyncPropertyStatus {
	true, // Property is set to true
	false, // Property is set to false
	propNotSet, // Property is not set
	parentPropNotSet, // In the manifest, the parent object of the property is not set
};

interface AsyncFlags {
	hasAsyncInterface: boolean;
	hasManifestDefinition: boolean;
	routingAsyncFlag: AsyncPropertyStatus;
	rootViewAsyncFlag: AsyncPropertyStatus;
}

export default function analyzeComponentJson({
	node,
	manifestContent,
	resourcePath,
	reporter,
	context,
	checker,
}: {
	node: ts.ExpressionWithTypeArguments;
	manifestContent: string | undefined;
	resourcePath: string;
	reporter: SourceFileReporter;
	context: LinterContext;
	checker: ts.TypeChecker;
}) {
	let classDesc = node.parent;
	while (classDesc && classDesc.kind !== ts.SyntaxKind.ClassDeclaration) {
		classDesc = classDesc.parent;
	}

	if (!classDesc || !ts.isClassDeclaration(classDesc)) {
		return;
	}

	const analysisResult = findAsyncInterface({
		classDefinition: classDesc, manifestContent, checker,
	});

	if (analysisResult) {
		reportResults({analysisResult, context, reporter, resourcePath, classDesc, manifestContent});
	}
}

function mergeResults(a: AsyncFlags, b: AsyncFlags): AsyncFlags {
	const compareValues = (aProp: AsyncPropertyStatus, bProp: AsyncPropertyStatus): AsyncPropertyStatus => {
		const priorityCheck = [
			AsyncPropertyStatus.parentPropNotSet,
			AsyncPropertyStatus.propNotSet,
			AsyncPropertyStatus.false,
			AsyncPropertyStatus.true,
		];
		const aIndex = priorityCheck.indexOf(aProp);
		const bIndex = priorityCheck.indexOf(bProp);

		return (aIndex > bIndex) ? aProp : bProp;
	};

	return {
		hasManifestDefinition: a.hasManifestDefinition || b.hasManifestDefinition,
		routingAsyncFlag: compareValues(a.routingAsyncFlag, b.routingAsyncFlag),
		rootViewAsyncFlag: compareValues(a.rootViewAsyncFlag, b.rootViewAsyncFlag),
		hasAsyncInterface: a.hasAsyncInterface || b.hasAsyncInterface,
	};
}

function findAsyncInterface({classDefinition, manifestContent, checker}: {
	classDefinition: ts.ClassDeclaration;
	manifestContent: string | undefined;
	checker: ts.TypeChecker;
}): AsyncFlags | undefined {
	const returnTypeTemplate = {
		hasAsyncInterface: false,
		routingAsyncFlag: AsyncPropertyStatus.parentPropNotSet,
		rootViewAsyncFlag: AsyncPropertyStatus.parentPropNotSet,
		hasManifestDefinition: false,
	} as AsyncFlags;

	// Checks the interfaces and manifest
	const curClassAnalysis = classDefinition.members.reduce((acc, member) => {
		const checkResult = doPropsCheck(member as ts.PropertyDeclaration, manifestContent);
		return mergeResults(acc, checkResult);
	}, {...returnTypeTemplate});

	const heritageAnalysis =
		classDefinition?.heritageClauses?.flatMap((parentClasses: ts.HeritageClause) => {
			return parentClasses.types.flatMap((parentClass) => {
				const parentClassType = checker.getTypeAtLocation(parentClass);

				return parentClassType.symbol?.declarations?.flatMap((declaration) => {
					let result = {...returnTypeTemplate} as AsyncFlags;
					// Continue down the heritage chain to search for
					// the async interface or manifest flags
					if (ts.isClassDeclaration(declaration)) {
						result = findAsyncInterface({
							classDefinition: declaration,
							manifestContent,
							checker,
						}) ?? result;
					} else if (ts.isInterfaceDeclaration(declaration)) {
						result.hasAsyncInterface = doAsyncInterfaceChecks(parentClass) ?? result.hasAsyncInterface;
					}

					return result;
				});
			});
		}) ?? [];

	return [...heritageAnalysis, curClassAnalysis].reduce((acc, curAnalysis) => {
		return mergeResults(acc ?? {...returnTypeTemplate}, curAnalysis ?? {...returnTypeTemplate});
	});
}

function isCoreImportDeclaration(statement: ts.Node): statement is ts.ImportDeclaration {
	return ts.isImportDeclaration(statement) &&
		ts.isStringLiteral(statement.moduleSpecifier) &&
		statement.moduleSpecifier.text === "sap/ui/core/library";
}

function doAsyncInterfaceChecks(importDeclaration: ts.Node): boolean {
	const sourceFile = importDeclaration.getSourceFile();

	let coreLibImports: ts.ImportDeclaration[] | undefined;
	if (sourceFile.isDeclarationFile) {
		let moduleDeclaration: ts.ModuleDeclaration | undefined;
		while (!moduleDeclaration && importDeclaration.kind !== ts.SyntaxKind.SourceFile) {
			if (ts.isModuleDeclaration(importDeclaration)) {
				moduleDeclaration = importDeclaration;
			} else {
				importDeclaration = importDeclaration.parent;
			}
		}

		if (moduleDeclaration?.body?.kind === ts.SyntaxKind.ModuleBlock) {
			coreLibImports = moduleDeclaration.body.statements.filter(isCoreImportDeclaration);
		}
	} else {
		coreLibImports = sourceFile.statements.filter(isCoreImportDeclaration);
	}

	if (!coreLibImports) {
		return false;
	}
	const hasAsyncImport = coreLibImports.some((importDecl) => {
		const importClause = importDecl.importClause;
		if (!importClause) {
			return;
		}
		if (!importClause.namedBindings) {
			// Example: import "sap/ui/core/library"; or import library from "sap/ui/core/library";
		} else if (ts.isNamedImports(importClause.namedBindings)) {
			// Example: import { IAsyncContentCreation } from "sap/ui/core/library";
			return importClause.namedBindings.elements.some(
				(namedImport) => namedImport.getText() === "IAsyncContentCreation");
		} else {
			// Example: import * as library from "sap/ui/core/library";
			// TODO: This requires additional handling
		}
	});

	return hasAsyncImport;
}

function doPropsCheck(metadata: ts.PropertyDeclaration, manifestContent: string | undefined) {
	let classInterfaces: ts.ObjectLiteralElementLike | undefined;
	let componentManifest: ts.ObjectLiteralElementLike | undefined;

	if (metadata && ts.isPropertyDeclaration(metadata) &&
		metadata.initializer && ts.isObjectLiteralExpression(metadata.initializer)) {
		metadata.initializer.properties.forEach((prop) => {
			if (!prop.name) {
				return;
			}
			const propText = getPropertyName(prop.name);

			if (propText === "interfaces") {
				classInterfaces = prop;
			} else if (propText === "manifest") {
				componentManifest = prop;
			}
		});
	}

	let hasAsyncInterface = false;
	if (classInterfaces && ts.isPropertyAssignment(classInterfaces) &&
		classInterfaces.initializer && ts.isArrayLiteralExpression(classInterfaces.initializer)) {
		hasAsyncInterface = classInterfaces.initializer
			.elements.some((implementedInterface) => {
				return ts.isStringLiteralLike(implementedInterface) &&
					implementedInterface.text === "sap.ui.core.IAsyncContentCreation";
			});
	}

	let rootViewAsyncFlag: AsyncPropertyStatus = AsyncPropertyStatus.parentPropNotSet;
	let routingAsyncFlag: AsyncPropertyStatus = AsyncPropertyStatus.parentPropNotSet;
	let hasManifestDefinition = false;

	if (componentManifest &&
		ts.isPropertyAssignment(componentManifest) &&
		ts.isObjectLiteralExpression(componentManifest.initializer)) {
		/* eslint-disable @typescript-eslint/no-explicit-any */
		const instanceOfPropsRecord = (obj: any): obj is propsRecord => {
			return !!obj && typeof obj === "object";
		};

		hasManifestDefinition = true;

		const manifestJson = extractPropsRecursive(componentManifest.initializer) ?? {};
		let manifestSapui5Section: propsRecordValueType | propsRecordValueType[] | undefined;
		if (instanceOfPropsRecord(manifestJson["sap.ui5"])) {
			manifestSapui5Section = manifestJson["sap.ui5"].value;
		}

		if (instanceOfPropsRecord(manifestSapui5Section) &&
			instanceOfPropsRecord(manifestSapui5Section?.rootView?.value)) {
			rootViewAsyncFlag = AsyncPropertyStatus.propNotSet;

			if (typeof manifestSapui5Section?.rootView?.value.async?.value === "boolean") {
				const isRootViewAsync = manifestSapui5Section?.rootView?.value.async?.value;
				rootViewAsyncFlag = isRootViewAsync ? AsyncPropertyStatus.true : AsyncPropertyStatus.false;
			}
		}

		if (instanceOfPropsRecord(manifestSapui5Section) &&
			instanceOfPropsRecord(manifestSapui5Section?.routing?.value)) {
			routingAsyncFlag = AsyncPropertyStatus.propNotSet;

			if (instanceOfPropsRecord(manifestSapui5Section?.routing?.value.config?.value) &&
				typeof manifestSapui5Section?.routing?.value.config?.value.async?.value === "boolean") {
				const isRoutingAsync = manifestSapui5Section?.routing?.value.config?.value.async?.value;
				routingAsyncFlag = isRoutingAsync ? AsyncPropertyStatus.true : AsyncPropertyStatus.false;
			}
		}
	} else {
		const parsedManifestContent =
			JSON.parse(manifestContent ?? "{}") as SAPJSONSchemaForWebApplicationManifestFile;

		const {rootView, routing} = parsedManifestContent["sap.ui5"] ?? {} as JSONSchemaForSAPUI5Namespace;

		if (rootView) {
			rootViewAsyncFlag = AsyncPropertyStatus.propNotSet;
			// @ts-expect-error async is part of RootViewDefFlexEnabled and RootViewDef
			const isRootViewAsync = rootView.async as boolean | undefined;
			if (typeof isRootViewAsync === "boolean") {
				rootViewAsyncFlag = isRootViewAsync ? AsyncPropertyStatus.true : AsyncPropertyStatus.false;
			}
		}

		if (routing) {
			routingAsyncFlag = AsyncPropertyStatus.propNotSet;
			const isRoutingAsync = routing?.config?.async;
			if (typeof isRoutingAsync === "boolean") {
				routingAsyncFlag = isRoutingAsync ? AsyncPropertyStatus.true : AsyncPropertyStatus.false;
			}
		}

		hasManifestDefinition = !!(componentManifest &&
		ts.isPropertyAssignment(componentManifest) &&
		componentManifest.initializer.getText() === "\"json\"");
	}

	return {
		routingAsyncFlag,
		rootViewAsyncFlag,
		hasAsyncInterface,
		hasManifestDefinition,
	};
}

function getPropertyName(node: ts.PropertyName): string {
	if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
		return node.text;
	} else {
		return node.getText();
	}
}

function extractPropsRecursive(node: ts.ObjectLiteralExpression) {
	const properties = Object.create(null) as propsRecord;

	node.properties?.forEach((prop) => {
		if (!ts.isPropertyAssignment(prop) || !prop.name) {
			return;
		}

		const key = getPropertyName(prop.name);
		if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
			properties[key] = {value: true, node: prop.initializer};
		} else if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
			properties[key] = {value: false, node: prop.initializer};
		} else if (prop.initializer.kind === ts.SyntaxKind.NullKeyword) {
			properties[key] = {value: null, node: prop.initializer};
		} else if (ts.isObjectLiteralExpression(prop.initializer) && prop.initializer.properties) {
			properties[key] = {value: extractPropsRecursive(prop.initializer), node: prop.initializer};
		} else if (ts.isArrayLiteralExpression(prop.initializer)) {
			const resolvedValue = prop.initializer.elements.map((elem) => {
				if (!ts.isObjectLiteralExpression(elem)) {
					return;
				}
				return extractPropsRecursive(elem);
			}).filter(($) => $) as propsRecordValueType[];

			properties[key] = {value: resolvedValue, node: prop.initializer};
		} else if (ts.isStringLiteralLike(prop.initializer) || ts.isNumericLiteral(prop.initializer)) {
			properties[key] = {value: prop.initializer.text, node: prop.initializer};
		} else if (ts.isIdentifier(prop.initializer) || ts.isPrivateIdentifier(prop.initializer)) {
			properties[key] = {value: prop.initializer.getText(), node: prop.initializer};
		} else {
			// throw new Error("Unhandled property assignment");
		}
	});
	return properties;
}

function reportResults({
	analysisResult, reporter, classDesc, manifestContent, resourcePath, context,
}: {
	analysisResult: AsyncFlags;
	reporter: SourceFileReporter;
	context: LinterContext;
	classDesc: ts.ClassDeclaration;
	manifestContent: string | undefined;
	resourcePath: string;
}) {
	const {hasAsyncInterface, routingAsyncFlag, rootViewAsyncFlag, hasManifestDefinition} = analysisResult;

	if (!hasManifestDefinition && !!manifestContent) {
		reporter.addMessage({
			node: classDesc,
			severity: LintMessageSeverity.Warning,
			ruleId: "ui5-linter-add-manifest",
			message: "Include a manifest section into the Component.js",
			messageDetails: "manifest.json will be loaded and used, " +
			"but is not defined in Component's metadata section",
		});
	}

	if (hasAsyncInterface !== true) {
		if ([AsyncPropertyStatus.propNotSet, AsyncPropertyStatus.false].includes(rootViewAsyncFlag) ||
			[AsyncPropertyStatus.propNotSet, AsyncPropertyStatus.false].includes(routingAsyncFlag)) {
			let message = "Root View and Routing are not configured to load their modules asynchronously.";
			let messageDetails = "{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. " +
				"Implement sap.ui.core.IAsyncContentCreation interface in Component.js or set async flags for " +
				"\"sap.ui5/routing/config\" and \"sap.ui5/rootView\" in the manifest";

			if (AsyncPropertyStatus.parentPropNotSet === rootViewAsyncFlag) {
				// sap.ui5/rootView is not set at all, so skip it in the message
				message = "Routing is not configured to load its targets asynchronously.";
				messageDetails = "{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. " +
				"Implement sap.ui.core.IAsyncContentCreation interface in Component.js or set async flag for " +
				"\"sap.ui5/routing/config\" in the manifest.";
			} else if (AsyncPropertyStatus.parentPropNotSet === routingAsyncFlag) {
				// sap.ui5/routing/config is not set at all, so skip it in the message
				message = "Root View is not configured to load its views asynchronously.";
				messageDetails = "{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. " +
				"Implement sap.ui.core.IAsyncContentCreation interface in Component.js or set async flag for " +
				"\"sap.ui5/rootView\" in the manifest.";
			}

			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-no-sync-loading",
				message,
				messageDetails,
			});
		}
	} else {
		const {pointers} = jsonMap.parse<jsonSourceMapType>(manifestContent ?? "{}");
		const report = (pointerKey: string, message: LintMessage) => {
			if (manifestContent) {
				// If the manifest.json is present, then we need to redirect the message pointers to it
				const {key: posInfo} = pointers[pointerKey];
				context.addLintingMessage(
					resourcePath.replace("Component.js", "manifest.json"), {...message, ...posInfo});
			} else {
				reporter.addMessage({...message, ...{node: classDesc}});
			}
		};

		if (rootViewAsyncFlag === AsyncPropertyStatus.true) {
			report("/sap.ui5/rootView/async", {
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-no-sync-loading",
				message: "'sap.ui.core.IAsyncContentCreation' interface is implemented for Component.js. " +
				"Remove the async flag for \"sap.ui5/rootView\" from the manifest",
				messageDetails: "{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}",
			});
		}
		if (routingAsyncFlag === AsyncPropertyStatus.true) {
			report("/sap.ui5/routing/config/async", {
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-no-sync-loading",
				message: "'sap.ui.core.IAsyncContentCreation' interface is implemented for Component.js. " +
				"Remove the async flag for \"sap.ui5/routing/config\" from the manifest",
				messageDetails: "{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}",
			});
		}
	}
}
