import {LintMessageSeverity} from "./LinterContext.js";
import {RULES} from "./linterReporting.js";

export enum MESSAGE {
	NO_DIRECT_DATATYPE_ACCESS,
}
export const MESSAGE_INFO = {
	[MESSAGE.NO_DIRECT_DATATYPE_ACCESS]: {
		severity: LintMessageSeverity.Error,
		ruleId: RULES["ui5-linter-no-pseudo-modules"],
		message: ({moduleName}: {moduleName: string}) =>
			`Deprecated access to DataType pseudo module '${moduleName}'`,
		details: () =>
			"{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Access to Pseudo Modules}",
	},
} as const;
