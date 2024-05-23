export const MESSAGES = {
	SHORT__NO_DIRECT_DATATYPE_ACCESS: "Deprecated access to DataType ('{0}').",
	DETAILS__NO_DIRECT_DATATYPE_ACCESS: "DataType can be accessed only via the static " +
		"DataType.getType(\"{0}\") method. " +
		"{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Deprecated Pseudo Modules}",
		
	SHORT__DEPRECATED_ACCESS_ENUM: "Deprecated access to ENUM pseudo module '{0}'",
	DETAILS__DEPRECATED_ACCESS_ENUM: "{@link topic:00737d6c1b864dc3ab72ef56611491c4 Migrating Deprecated Pseudo Modules}",
}

// TODO: Migrate to enum instead of Object/Map
// Currently, it's done this way to avoid polution of the test snapshots
export const RULES = {
	"ui5-linter-no-deprecated-api": "ui5-linter-no-deprecated-api",
	"ui5-linter-no-partially-deprecated-api": "ui5-linter-no-partially-deprecated-api",
	"ui5-linter-no-deprecated-property": "ui5-linter-no-deprecated-property",
	"ui5-linter-no-pseudo-modules": "ui5-linter-no-pseudo-modules",
	"ui5-linter-no-globals-js": "ui5-linter-no-globals-js",
	"ui5-linter-parsing-error": "ui5-linter-parsing-error",
}

export function formatMessage(message: string, ...params: string[]) {
	for (let i = 0; i < params.length; i++) {
		message = message.replace(`{${i}}`, params[i]);
	}

	return message;
}