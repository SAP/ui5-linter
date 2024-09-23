import {ReadStream} from "node:fs";
import {extractJSScriptTags} from "./parser.js";
import HtmlReporter from "./HtmlReporter.js";
import LinterContext, {ResourcePath, TranspileResult} from "../LinterContext.js";
import {taskStart} from "../../utils/perf.js";
import {MESSAGE} from "../messages.js";
import {Tag, Attribute} from "sax-wasm";
import {deprecatedLibraries, deprecatedThemeLibraries} from "../../utils/deprecations.js";

export default async function transpileHtml(
	resourcePath: ResourcePath, contentStream: ReadStream, context: LinterContext
): Promise<TranspileResult | undefined> {
	try {
		const taskEnd = taskStart("Transpile HTML", resourcePath, true);
		const report = new HtmlReporter(resourcePath, context);
		const jsScriptTags = await extractJSScriptTags(contentStream);

		jsScriptTags.forEach((tag) => {
			// Tags with src attribute do not parse and run inline code
			const hasSrc = tag.attributes.some((attr) => {
				return attr.name.value.toLowerCase() === "src";
			});
			debugger;
			if (!hasSrc && tag.textNodes?.length > 0) {
				report.addMessage(MESSAGE.CSP_UNSAFE_INLINE_SCRIPT, tag);
			} else if (isBootstrapTag(tag)) {
				lintBootstrapAttributes(tag, report);
			}
		});

		taskEnd();
		return {source: "", map: ""};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		context.addLintingMessage(resourcePath, MESSAGE.PARSING_ERROR, {message});
		return;
	}
}

function isBootstrapTag(tag: Tag): boolean {
	for (const attr of tag.attributes) {
		if (attr.name.value.toLowerCase() === "id") {
			if (attr.value.value.toLowerCase() === "sap-ui-bootstrap") {
				return true;
			}
			break;
		}
	}
	return false;
}

function lintBootstrapAttributes(tag: Tag, report: HtmlReporter) {
	const attributes = new Set();
	for (const attr of tag.attributes) {
		const attributeName = attr.name.value.toLowerCase();
		attributes.add(attributeName);
		switch (attributeName) {
			case "data-sap-ui-theme":
				checkThemeAttr(attr, report);
				break;
			case "data-sap-ui-libs":
				checkLibraryAttr(attr, report);
				break;
			case "data-sap-ui-modules":
				checkLibraryAttr(attr, report, true);
				break;
			case "data-sap-ui-async":
				checkAsyncAttr(attr, report);
				break;
			case "data-sap-ui-compat-version":
				checkCompatVersionAttr(attr, report);
				break;
			case "data-sap-ui-on-init":
				checkOnInitAttr(attr, report);
				break;
		}
	}

	if (!attributes.has("data-sap-ui-async")) {
		report.addMessage(MESSAGE.MISSING_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-async",
			details: `{@link topic:91f2d03b6f4d1014b6dd926db0e91070 Configuration Options and URL Parameters}`,
		}, tag);
	} else if (!attributes.has("data-sap-ui-compat-version")) {
		report.addMessage(MESSAGE.MISSING_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-compat-version",
			details: `{@link topic:9feb96da02c2429bb1afcf6534d77c79 Compatibility Version Information (deprecated)}`,
		}, tag);
	}
}

function checkThemeAttr(attr: Attribute, report: HtmlReporter) {
	const themeName = attr.value.value.toLowerCase();
	if (deprecatedThemeLibraries.includes(`themelib_${themeName}`)) {
		report.addMessage(MESSAGE.DEPRECATED_THEME_LIBRARY, {
			themeName,
		}, attr.value);
	}
}

function checkLibraryAttr(attr: Attribute, report: HtmlReporter, modulesSyntax = false) {
	const libraries = attr.value.value.toLowerCase().split(",");
	for (let libraryName of libraries) {
		if (modulesSyntax) {
			// The syntax in data-sap-ui-modules is slightly different, the library name
			// is always followed by ".library" to specify the "library module".
			// This string needs to be removed to match the deprecated libraries list:
			// sap.ui.commons.library => sap.ui.commons
			libraryName = libraryName.replace(/\.library$/, "");
		}
		if (deprecatedLibraries.includes(libraryName.trim())) {
			report.addMessage(MESSAGE.DEPRECATED_LIBRARY, {
				libraryName,
			}, attr.value);
		}
	}
}

function checkAsyncAttr(attr: Attribute, report: HtmlReporter) {
	if (attr.value.value.toLowerCase() === "false") {
		report.addMessage(MESSAGE.DEPRECATED_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-async",
			value: "false",
			details: `{@link topic:91f2d03b6f4d1014b6dd926db0e91070 Configuration Options and URL Parameters}`,
		}, attr.value);
	}
}

function checkCompatVersionAttr(attr: Attribute, report: HtmlReporter) {
	if (attr.value.value !== "edge") {
		report.addMessage(MESSAGE.DEPRECATED_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-compat-version",
			value: attr.value.value,
			details: `{@link topic:9feb96da02c2429bb1afcf6534d77c79 Compatibility Version Information (deprecated)}`,
		}, attr.value);
	}
}

function checkOnInitAttr(attr: Attribute, report: HtmlReporter) {
	const value = attr.value.value.toLowerCase().trim();
	if (!value.startsWith("module:")) {
		report.addMessage(MESSAGE.DEPRECATED_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-on-init",
			value,
			details: `{@link topic:91f2d03b6f4d1014b6dd926db0e91070 Configuration Options and URL Parameters}`,
		}, attr.value);
	}
}
