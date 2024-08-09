import type {MESSAGE_INFO} from "./messages.js";

export const MESSAGES = {
	// Used by ManifestLinter
	SHORT__DEPRECATED_PROP: "Use of deprecated property {0}",

	SHORT__DEPRECATED_COMPONENT: "Use of deprecated component '{0}'",

	SHORT__LIB_INIT_2: "Call to {0}() must be declared with property {apiVersion: 2}",
	DETAILS__LIB_INIT_2: "{@link sap.ui.core.Lib.init Lib.init}",

	SHORT__DEPRECATED_LIBRARY: "Use of deprecated library '{0}'",

	SHORT__DEPRECATED_MODEL_TYPE: "Use of deprecated model type '{0}'",
};

// TODO: Migrate to enum instead of Object/Map
// Currently, it's done this way to avoid pollution of the test snapshots
export const RULES = {
	"ui5-linter-no-deprecated-api": "ui5-linter-no-deprecated-api",
	"ui5-linter-no-partially-deprecated-api": "ui5-linter-no-partially-deprecated-api",
	"ui5-linter-no-deprecated-property": "ui5-linter-no-deprecated-property",
	"ui5-linter-no-pseudo-modules": "ui5-linter-no-pseudo-modules",
	"ui5-linter-no-globals-js": "ui5-linter-no-globals-js",
	"ui5-linter-parsing-error": "ui5-linter-parsing-error",
	"ui5-linter-no-deprecated-library": "ui5-linter-no-deprecated-library",
	"ui5-linter-no-deprecated-component": "ui5-linter-no-deprecated-component",
};

export function formatMessage(message: string, ...params: string[]) {
	for (let i = 0; i < params.length; i++) {
		message = message.replace(`{${i}}`, params[i]);
	}

	return message;
}

export type MessageInfo = typeof MESSAGE_INFO[keyof typeof MESSAGE_INFO] & {fatal?: boolean};

type ExtractArgs<F> = F extends (args: infer P) => unknown ? P : never;
type CombineArgs<M, D> = M & D extends object ? M & D : never;

export type MessageArgs = {
	[K in keyof typeof MESSAGE_INFO]:
	CombineArgs<
		ExtractArgs<typeof MESSAGE_INFO[K]["message"]>, ExtractArgs<typeof MESSAGE_INFO[K]["details"]>
	>;
};
