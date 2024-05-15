import ts from "typescript";
import SourceFileReporter from "./SourceFileReporter.js";
import type {JSONSchemaForSAPUI5Namespace, SAPJSONSchemaForWebApplicationManifestFile} from "../../manifest.js";
import {LintMessageSeverity} from "../LinterContext.js";

type propsRecordValueType = string | boolean | undefined | null | number | propsRecord;
type propsRecord = Record<string, {
	value: propsRecordValueType | propsRecordValueType[];
	node?: ts.Node;
}>;

enum AsyncInterfaceStatus {true, false, propNotSet, parentPropNotSet};

interface AsyncInterfaceFindType {
	hasAsyncInterface: AsyncInterfaceStatus;
	hasManifestDefinition: boolean;
	routingAsyncFlag: AsyncInterfaceStatus;
	rootViewAsyncFlag: AsyncInterfaceStatus;
}

export default function analyzeComponentJson(
	node: ts.ExpressionWithTypeArguments,
	manifestContent: string | undefined,
	reporter: SourceFileReporter,
	checker: ts.TypeChecker
) {
	let parent = node.parent;
	let classDesc;
	while (parent && parent.kind !== ts.SyntaxKind.SourceFile) {
		if (parent.kind === ts.SyntaxKind.ClassDeclaration) {
			classDesc = parent;
		}
		parent = parent.parent;
	}

	if (!ts.isSourceFile(parent) ||
		!parent.fileName.endsWith("/Component.js") ||
		!classDesc ||
		!ts.isClassDeclaration(classDesc)) {
		return;
	}

	const analysisResult = findAsyncInterface({
		classDefinition: classDesc, manifestContent, checker,
	});

	if (analysisResult) {
		reportResults(analysisResult, reporter, classDesc);
	}
}

function mergeResults(a: AsyncInterfaceFindType, b: AsyncInterfaceFindType): AsyncInterfaceFindType {
	const compareValues = (aProp: AsyncInterfaceStatus, bProp: AsyncInterfaceStatus): AsyncInterfaceStatus => {
		const priorityCheck = [
			AsyncInterfaceStatus.parentPropNotSet,
			AsyncInterfaceStatus.propNotSet,
			AsyncInterfaceStatus.false,
			AsyncInterfaceStatus.true,
		];
		const aIndex = priorityCheck.indexOf(aProp);
		const bIndex = priorityCheck.indexOf(bProp);

		return (aIndex > bIndex) ? aProp : bProp;
	};

	return {
		hasManifestDefinition: a.hasManifestDefinition || b.hasManifestDefinition,
		routingAsyncFlag: compareValues(a.routingAsyncFlag, b.routingAsyncFlag),
		rootViewAsyncFlag: compareValues(a.rootViewAsyncFlag, b.rootViewAsyncFlag),
		hasAsyncInterface: compareValues(a.hasAsyncInterface, b.hasAsyncInterface),
	};
}

function findAsyncInterface({classDefinition, manifestContent, checker}: {
	classDefinition: ts.ClassDeclaration;
	manifestContent: string | undefined;
	checker: ts.TypeChecker;
}): AsyncInterfaceFindType | undefined {
	const returnTypeTemplate = {
		hasAsyncInterface: AsyncInterfaceStatus.parentPropNotSet,
		routingAsyncFlag: AsyncInterfaceStatus.parentPropNotSet,
		rootViewAsyncFlag: AsyncInterfaceStatus.parentPropNotSet,
		hasManifestDefinition: false,
	} as AsyncInterfaceFindType;

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
					let result = {...returnTypeTemplate} as AsyncInterfaceFindType;
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

function doAsyncInterfaceChecks(importDeclaration: ts.Node): AsyncInterfaceStatus {
	while (importDeclaration && importDeclaration.kind !== ts.SyntaxKind.SourceFile) {
		importDeclaration = importDeclaration.parent;
	}

	// @ts-expect-error imports is part of SourceFileObject
	const moduleImports = importDeclaration?.imports as ts.Node[];
	const coreLib = moduleImports?.find((importModule) => {
		return importModule.getText() === "\"sap/ui/core/library\"";
	}) as ts.StringLiteral | undefined;

	let hasAsyncInterface = AsyncInterfaceStatus.propNotSet;
	if (coreLib && ts.isImportDeclaration(coreLib.parent)) {
		if (coreLib.parent.importClause?.namedBindings &&
			coreLib.parent.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
			const hasAsyncImport = coreLib.parent.importClause.namedBindings.elements.some(
				(namedImport) => namedImport.getText() === "IAsyncContentCreation");

			hasAsyncInterface = hasAsyncImport ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
		} else {
			const implementsAsyncInterface =
				coreLib.parent.importClause?.name?.getText() === "IAsyncContentCreation";

			hasAsyncInterface = implementsAsyncInterface ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
		}
	}

	return hasAsyncInterface;
}

function doPropsCheck(metadata: ts.PropertyDeclaration, manifestContent: string | undefined) {
	let classInterfaces: ts.ObjectLiteralElementLike | undefined;
	let componentManifest: ts.ObjectLiteralElementLike | undefined;

	if (metadata && ts.isPropertyDeclaration(metadata) &&
		metadata.initializer && ts.isObjectLiteralExpression(metadata.initializer)) {
		metadata.initializer.properties.forEach((prop) => {
			if (["interfaces", "\"interfaces\""].includes(prop.name?.getText() ?? "")) {
				classInterfaces = prop;
			} else if (["manifest", "\"manifest\""].includes(prop.name?.getText() ?? "")) {
				componentManifest = prop;
			}
		});
	}

	let hasAsyncInterface = AsyncInterfaceStatus.propNotSet;
	if (classInterfaces && ts.isPropertyAssignment(classInterfaces) &&
		classInterfaces.initializer && ts.isArrayLiteralExpression(classInterfaces.initializer)) {
		const hasAsyncInterfaceProp = classInterfaces.initializer
			.elements.some((implementedInterface) =>
				implementedInterface.getText() === "\"sap.ui.core.IAsyncContentCreation\"");

		hasAsyncInterface = hasAsyncInterfaceProp ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
	}

	// undefined has ambiguous meaning in that context.
	// It could mean either implicit "true" or "false".
	// To distinguish whether it's been set from manifest's config
	// or not set at all, we'll use null.
	let rootViewAsyncFlag: AsyncInterfaceStatus = AsyncInterfaceStatus.parentPropNotSet;
	let routingAsyncFlag: AsyncInterfaceStatus = AsyncInterfaceStatus.parentPropNotSet;
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
		if (instanceOfPropsRecord(manifestJson["\"sap.ui5\""])) {
			manifestSapui5Section = manifestJson["\"sap.ui5\""].value;
		}

		if (instanceOfPropsRecord(manifestSapui5Section) &&
			instanceOfPropsRecord(manifestSapui5Section?.rootView?.value)) {
			rootViewAsyncFlag = AsyncInterfaceStatus.propNotSet;

			if (typeof manifestSapui5Section?.rootView?.value.async?.value === "boolean") {
				const isRootViewAsync = manifestSapui5Section?.rootView?.value.async?.value;
				rootViewAsyncFlag = isRootViewAsync ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
			}
		}

		if (instanceOfPropsRecord(manifestSapui5Section) &&
			instanceOfPropsRecord(manifestSapui5Section?.routing?.value)) {
			routingAsyncFlag = AsyncInterfaceStatus.propNotSet;

			if (instanceOfPropsRecord(manifestSapui5Section?.routing?.value.config?.value) &&
				typeof manifestSapui5Section?.routing?.value.config?.value.async?.value === "boolean") {
				const isRoutingAsync = manifestSapui5Section?.routing?.value.config?.value.async?.value;
				routingAsyncFlag = isRoutingAsync ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
			}
		}
	} else {
		const parsedManifestContent =
			JSON.parse(manifestContent ?? "{}") as SAPJSONSchemaForWebApplicationManifestFile;

		const {rootView, routing} = parsedManifestContent["sap.ui5"] ?? {} as JSONSchemaForSAPUI5Namespace;

		if (rootView) {
			rootViewAsyncFlag = AsyncInterfaceStatus.propNotSet;
			// @ts-expect-error async is part of RootViewDefFlexEnabled and RootViewDef
			const isRootViewAsync = rootView.async as boolean | undefined;
			if (typeof isRootViewAsync === "boolean") {
				rootViewAsyncFlag = isRootViewAsync ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
			}
		}

		if (routing) {
			routingAsyncFlag = AsyncInterfaceStatus.propNotSet;
			const isRoutingAsync = routing?.config?.async;
			if (typeof isRoutingAsync === "boolean") {
				routingAsyncFlag = isRoutingAsync ? AsyncInterfaceStatus.true : AsyncInterfaceStatus.false;
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

function extractPropsRecursive(node: ts.ObjectLiteralExpression) {
	const properties = Object.create(null) as propsRecord;

	node.properties?.forEach((prop) => {
		if (!ts.isPropertyAssignment(prop) || !prop.name) {
			return;
		}

		const key = prop.name.getText();
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
		} else if (
			(ts.isIdentifier(prop.initializer) ||
			ts.isNumericLiteral(prop.initializer) ||
			ts.isStringLiteral(prop.initializer)) &&

			prop.initializer.getText()) {
			properties[key] = {value: prop.initializer.getText(), node: prop.initializer};
		} else {
			// throw new Error("Unhandled property assignment");
		}
	});
	return properties;
}

function reportResults(
	analysisResult: AsyncInterfaceFindType,
	reporter: SourceFileReporter,
	classDesc: ts.ClassDeclaration
) {
	const {hasAsyncInterface, routingAsyncFlag, rootViewAsyncFlag, hasManifestDefinition} = analysisResult;

	if (!hasManifestDefinition) {
		reporter.addMessage({
			node: classDesc,
			severity: LintMessageSeverity.Warning,
			ruleId: "ui5-linter-add-manifest",
			message: "Include a manifest section into the Component.js",
			messageDetails: "manifest.json will be loaded and used, " +
			"but is not defined in Component's metadata section",
		});
	}

	if (hasAsyncInterface !== AsyncInterfaceStatus.true) {
		if ([AsyncInterfaceStatus.propNotSet, AsyncInterfaceStatus.false].includes(rootViewAsyncFlag) ||
			[AsyncInterfaceStatus.propNotSet, AsyncInterfaceStatus.false].includes(routingAsyncFlag)) {
			let componentsToAddress = [];
			if (AsyncInterfaceStatus.parentPropNotSet !== rootViewAsyncFlag) {
				componentsToAddress.push("Root View");
			}
			if (AsyncInterfaceStatus.parentPropNotSet !== routingAsyncFlag) {
				componentsToAddress.push("Routing");
			}

			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-no-sync-loading",
				message: `${componentsToAddress.join(" and ")} ${componentsToAddress.length > 1 ? "are" : "is"} ` +
				"not configured to load targets asynchronously",
				messageDetails: "{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. " +
				"Implement sap.ui.core.IAsyncContentCreation interface in Component.js or set async flags for " +
				"\"sap.ui5/routing/config\" and \"sap.ui5/rootView\" in the manifest.json",
			});
		}
	} else {
		if (rootViewAsyncFlag === AsyncInterfaceStatus.true) {
			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-no-sync-loading",
				message: "'sap.ui.core.IAsyncContentCreation' interface is implemented for Component.js. " +
				"Remove the async flag for \"sap.ui5/rootView\" from the manifest",
				messageDetails: "{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}",
			});
		}
		if (routingAsyncFlag === AsyncInterfaceStatus.true) {
			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-no-sync-loading",
				message: "'sap.ui.core.IAsyncContentCreation' interface is implemented for Component.js. " +
				"Remove the async flag for \"sap.ui5/routing/config\" from the manifest",
				messageDetails: "{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}",
			});
		}
	}
}