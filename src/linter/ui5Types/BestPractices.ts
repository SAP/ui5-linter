import ts from "typescript";
import SourceFileReporter from "./SourceFileReporter.js";
import type {JSONSchemaForSAPUI5Namespace, SAPJSONSchemaForWebApplicationManifestFile} from "../../manifest.d.ts";
import {LintMessageSeverity} from "../LinterContext.js";

type propsRecordValueType = string | boolean | undefined | null | number | propsRecord;
type propsRecord = Record<string, {
	value: propsRecordValueType | propsRecordValueType[];
	node?: ts.Node;
}>;

interface AsyncInterfaceFindType {
	hasAsyncInterface: boolean | undefined | null;
	routingAsyncFlag: boolean | undefined | null;
	rootViewAsyncFlag: boolean | undefined | null;
}

export default function analyzeComponentJson(
	node: ts.ExpressionWithTypeArguments,
	manifestContent: string | undefined,
	reporter: SourceFileReporter,
	checker: ts.TypeChecker
) {
	let parent = node.parent;
	let classDesc;
	while (!parent || parent.kind !== ts.SyntaxKind.SourceFile) {
		if (parent.kind === ts.SyntaxKind.ClassDeclaration) {
			classDesc = parent;
		}
		parent = parent.parent;
	}

	if (!ts.isSourceFile(parent) || !parent.fileName.endsWith("/Component.js") || !classDesc) {
		return;
	}

	if (classDesc && ts.isClassDeclaration(classDesc)) {
		const analysisResult = findAsyncInterface(classDesc, manifestContent, checker);

		if (analysisResult) {
			reportResults(analysisResult, reporter, classDesc);
		}
	}
}

function mergeResults(a: AsyncInterfaceFindType, b: AsyncInterfaceFindType): AsyncInterfaceFindType {
	// null = parent property does not exist i.e. rootView
	// undefined = async flag is missing
	// true|false = async flag is explicitly set

	const compareValues = (aProp: null | undefined | boolean,
		bProp: null | undefined | boolean): null | undefined | boolean => {
		let result = null;
		if (aProp === undefined || bProp === undefined) {
			result = undefined;
		}
		if (typeof aProp === "boolean" || typeof bProp === "boolean") {
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			result = aProp || bProp;
		}

		return result;
	};

	return {
		routingAsyncFlag: compareValues(a.routingAsyncFlag, b.routingAsyncFlag),
		rootViewAsyncFlag: compareValues(a.rootViewAsyncFlag, b.rootViewAsyncFlag),
		hasAsyncInterface: compareValues(a.hasAsyncInterface, b.hasAsyncInterface),
	};
}

function findAsyncInterface(
	classDefinition: ts.ClassDeclaration,
	manifestContent: string | undefined,
	checker: ts.TypeChecker
): AsyncInterfaceFindType | undefined {
	if (ts.isClassDeclaration(classDefinition)) {
		const returnTypeTemplate = {
			hasAsyncInterface: null,
			routingAsyncFlag: null,
			rootViewAsyncFlag: null,
		} as AsyncInterfaceFindType;

		// Checks the interfaces and manifest
		const curClassAnalysis = classDefinition.members.reduce((acc, member) => {
			const checkResult = doChecks(member as ts.PropertyDeclaration, manifestContent);
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
						if (ts.isClassDeclaration(declaration) &&
							declaration?.name?.getText() !== "UIComponent") {
							result = findAsyncInterface(declaration, manifestContent, checker) ?? result;
						}

						return result;
					});
				});
			}) ?? [];

		return [...heritageAnalysis, curClassAnalysis].reduce((acc, curAnalysis) => {
			return mergeResults(acc ?? {...returnTypeTemplate}, curAnalysis ?? {...returnTypeTemplate});
		});
	}
}

function doChecks(metadata: ts.PropertyDeclaration, manifestContent: string | undefined) {
	let classInterfaces: ts.ObjectLiteralElementLike | undefined;
	let componentManifest: ts.ObjectLiteralElementLike | undefined;

	if (metadata && ts.isPropertyDeclaration(metadata) &&
		metadata.initializer && ts.isObjectLiteralExpression(metadata.initializer)) {
		metadata.initializer.properties.forEach((prop) => {
			if (prop.name?.getText() === "interfaces") {
				classInterfaces = prop;
			}
			if (prop.name?.getText() === "manifest") {
				componentManifest = prop;
			}
		});
	}

	let hasAsyncInterface = null;
	if (classInterfaces && ts.isPropertyAssignment(classInterfaces) &&
		classInterfaces.initializer && ts.isArrayLiteralExpression(classInterfaces.initializer)) {
		hasAsyncInterface = classInterfaces.initializer
			.elements.some((implementedInterface) =>
				implementedInterface.getText() === "\"sap.ui.core.IAsyncContentCreation\"");
	}

	// undefined has ambiguous meaning in that context.
	// It could mean either implicit "true" or "false".
	// To distinguish whether it's been set from manifest's config
	// or not set at all, we'll use null.
	let rootViewAsyncFlag: boolean | undefined | null = null;
	let routingAsyncFlag: boolean | undefined | null = null;

	if (componentManifest && ts.isPropertyAssignment(componentManifest)) {
		// The manifest is an external manifest.json file
		if (componentManifest.initializer.getText() === "\"json\"") {
			const parsedManifestContent =
				JSON.parse(manifestContent ?? "{}") as SAPJSONSchemaForWebApplicationManifestFile;

			const {rootView, routing} = parsedManifestContent["sap.ui5"] ?? {} as JSONSchemaForSAPUI5Namespace;
			// @ts-expect-error async is part of RootViewDefFlexEnabled and RootViewDef
			rootViewAsyncFlag = rootView ? rootView.async as boolean | undefined : rootViewAsyncFlag;
			routingAsyncFlag = routing?.config ? routing.config.async : routingAsyncFlag;
		} else if (ts.isObjectLiteralExpression(componentManifest.initializer)) {
			/* eslint-disable @typescript-eslint/no-explicit-any */
			const instanceOfPropsRecord = (obj: any): obj is propsRecord => {
				return !!obj && typeof obj === "object";
			};

			const manifestJson = extractPropsRecursive(componentManifest.initializer) ?? {};
			let manifestSapui5Section: propsRecordValueType | propsRecordValueType[] | undefined;
			if (instanceOfPropsRecord(manifestJson["\"sap.ui5\""])) {
				manifestSapui5Section = manifestJson["\"sap.ui5\""].value;
			}

			if (instanceOfPropsRecord(manifestSapui5Section) &&
				instanceOfPropsRecord(manifestSapui5Section?.rootView?.value) &&
				typeof manifestSapui5Section?.rootView?.value.async?.value === "boolean") {
				rootViewAsyncFlag = manifestSapui5Section?.rootView?.value.async?.value;
			}

			if (instanceOfPropsRecord(manifestSapui5Section) &&
				instanceOfPropsRecord(manifestSapui5Section?.routing?.value) &&
				instanceOfPropsRecord(manifestSapui5Section?.routing?.value.config?.value) &&
				typeof manifestSapui5Section?.routing?.value.config?.value.async?.value === "boolean") {
				routingAsyncFlag = manifestSapui5Section?.routing?.value.config?.value.async?.value;
			}
		}
	}

	return {
		routingAsyncFlag,
		rootViewAsyncFlag,
		hasAsyncInterface,
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
	let hasAsyncInterface: null | undefined | boolean = null;
	let routingAsyncFlag: null | undefined | boolean = null;
	let rootViewAsyncFlag: null | undefined | boolean = null;
	({hasAsyncInterface, routingAsyncFlag, rootViewAsyncFlag} = analysisResult);

	if (!hasAsyncInterface) {
		if (rootViewAsyncFlag === false || rootViewAsyncFlag === undefined ||
			routingAsyncFlag === false || routingAsyncFlag === undefined ||
			(hasAsyncInterface === null && rootViewAsyncFlag === null && routingAsyncFlag === null)) {
			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Error,
				ruleId: "ui5-linter-no-sync-loading",
				message: "Root View and Routing are not configured to load targets asynchronously",
				messageDetails: "{@link topic:676b636446c94eada183b1218a824717 Use Asynchronous Loading}. " +
				"Implement sap.ui.core.IAsyncContentCreation interface in Component.js or set async flags for " +
				"\"sap.ui5/routing/config\" and \"sap.ui5/rootView\" in the manifest.json",
			});
		}
	} else {
		if (rootViewAsyncFlag === true) {
			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-no-sync-loading",
				message: "Remove the async flag for \"sap.ui5/rootView\" from the manifest",
				messageDetails: "{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}",
			});
		}
		if (routingAsyncFlag === true) {
			reporter.addMessage({
				node: classDesc,
				severity: LintMessageSeverity.Warning,
				ruleId: "ui5-linter-no-sync-loading",
				message: "Remove the async flag for \"sap.ui5/routing/config\" from the manifest",
				messageDetails: "{@link sap.ui.core.IAsyncContentCreation sap.ui.core.IAsyncContentCreation}",
			});
		}
	}
}
