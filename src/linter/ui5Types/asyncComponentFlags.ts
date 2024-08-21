import ts from "typescript";
import path from "node:path/posix";
import SourceFileReporter from "./SourceFileReporter.js";
import type {JSONSchemaForSAPUI5Namespace, SAPJSONSchemaForWebApplicationManifestFile} from "../../manifest.js";
import LinterContext, {LintMessage, LintMessageSeverity} from "../LinterContext.js";
import jsonMap from "json-source-map";
import type {jsonSourceMapType} from "../manifestJson/ManifestLinter.js";
import {MESSAGE} from "../messages.js";

type propsRecordValueType = string | boolean | undefined | null | number | propsRecord;
type propsRecord = Record<string, {
	value: propsRecordValueType | propsRecordValueType[];
	node?: ts.Node;
}>;

enum AsyncPropertyStatus {
	parentPropNotSet, // In the manifest, the parent object of the property is not set
	propNotSet, // Property is not set
	false, // Property is set to false
	true, // Property is set to true
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
function getHighestPropertyStatus(aProp: AsyncPropertyStatus, bProp: AsyncPropertyStatus): AsyncPropertyStatus {
	return aProp > bProp ? aProp : bProp;
};

function mergeAsyncFlags(a: AsyncFlags, b: AsyncFlags): AsyncFlags {
	return {
		hasManifestDefinition: a.hasManifestDefinition || b.hasManifestDefinition,
		routingAsyncFlag: getHighestPropertyStatus(a.routingAsyncFlag, b.routingAsyncFlag),
		rootViewAsyncFlag: getHighestPropertyStatus(a.rootViewAsyncFlag, b.rootViewAsyncFlag),
		hasAsyncInterface: a.hasAsyncInterface || b.hasAsyncInterface,
	};
}

/**
 * Search for the async interface in the class hierarchy
*/
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

	// Checks the interfaces and manifest of the class
	const curClassAnalysis = classDefinition.members.reduce((acc, member) => {
		const checkResult = doPropsCheck(member as ts.PropertyDeclaration, manifestContent);
		return mergeAsyncFlags(acc, checkResult);
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
							// We are unable to dynamically search for a parent-component's manifest.json
							manifestContent: undefined,
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
		return mergeAsyncFlags(acc ?? {...returnTypeTemplate}, curAnalysis ?? {...returnTypeTemplate});
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
	} else if (manifestContent) {
		const parsedManifestContent =
			JSON.parse(manifestContent) as SAPJSONSchemaForWebApplicationManifestFile;

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
	const componentFileName = path.basename(resourcePath);

	if (!hasManifestDefinition && !!manifestContent) {
		reporter.addMessage(MESSAGE.COMPONENT_MISSING_MANIFEST_DECLARATION, classDesc);
	}

	if (hasAsyncInterface !== true) {
		if ([AsyncPropertyStatus.propNotSet, AsyncPropertyStatus.false].includes(rootViewAsyncFlag) ||
			[AsyncPropertyStatus.propNotSet, AsyncPropertyStatus.false].includes(routingAsyncFlag)) {
			let asyncFlagMissingIn;
			if (AsyncPropertyStatus.parentPropNotSet === rootViewAsyncFlag) {
				// sap.ui5/rootView is not set at all, so skip it in the message
				asyncFlagMissingIn = `"sap.ui5/routing/config"`;
			} else if (AsyncPropertyStatus.parentPropNotSet === routingAsyncFlag) {
				// sap.ui5/routing/config is not set at all, so skip it in the message
				asyncFlagMissingIn = `"sap.ui5/rootView"`;
			} else {
				asyncFlagMissingIn = `"sap.ui5/routing/config" and "sap.ui5/rootView"`;
			}

			reporter.addMessage(MESSAGE.COMPONENT_MISSING_ASYNC_INTERFACE, {
				componentFileName,
				asyncFlagMissingIn,
			}, classDesc);
		}
	} else {
		const {pointers} = jsonMap.parse<jsonSourceMapType>(manifestContent ?? "{}");
		const report = (pointerKey: string) => {
			if (manifestContent) {
				// If the manifest.json is present, then we need to redirect the message pointers to it
				const {key: posInfo} = pointers[pointerKey];
				context.addLintingMessage(
					resourcePath.replace(componentFileName, "manifest.json"), {
						severity: LintMessageSeverity.Warning,
						ruleId: "ui5-linter-async-component-flags",
						message: `Component implements the sap.ui.core.IAsyncContentCreation interface. ` +
						`The redundant "async" flag at "${pointerKey}" should be removed from the component manifest`,
						messageDetails: `{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}`,
						...posInfo,
					});
			} else {
				reporter.addMessage(MESSAGE.COMPONENT_REDUNDANT_ASYNC_FLAG, {
					asyncFlagLocation: pointerKey,
				}, classDesc);
			}
		};

		if (rootViewAsyncFlag === AsyncPropertyStatus.true) {
			report("/sap.ui5/rootView/async");
		}
		if (routingAsyncFlag === AsyncPropertyStatus.true) {
			report("/sap.ui5/routing/config/async");
		}
	}
}
