import type {Package} from "update-notifier";
import {createRequire} from "module";

export default async function updateNotifier() {
	const require = createRequire(import.meta.url);
	const pkg = require("../../../package.json") as Package;

	// Only import update-notifier when it's not disabled
	// See https://github.com/yeoman/update-notifier/blob/3046d0f61a57f8270291b6ab271f8a12df8421a6/update-notifier.js#L57-L60
	// The "is-ci" check is not executed, but will be checked by update-notifier itself then
	const NO_UPDATE_NOTIFIER = "--no-update-notifier";
	const disableUpdateNotifier =
		"NO_UPDATE_NOTIFIER" in process.env ||
		process.env.NODE_ENV === "test" ||
		process.argv.includes(NO_UPDATE_NOTIFIER);

	/* istanbul ignore if */
	if (!disableUpdateNotifier) {
		const {default: updateNotifier} = await import("update-notifier");
		updateNotifier({
			pkg,
			updateCheckInterval: 86400000, // 1 day
			shouldNotifyInNpmScript: true,
		}).notify();
	}

	// Remove --no-update-notifier from argv as it's not known to yargs, but we still want to support using it
	/* istanbul ignore if */
	if (process.argv.includes(NO_UPDATE_NOTIFIER)) {
		process.argv = process.argv.filter((v) => v !== NO_UPDATE_NOTIFIER);
	}
}
