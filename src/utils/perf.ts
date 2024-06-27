import {hrtime} from "node:process";
import figures from "figures";
import chalk from "chalk";
import {isLogLevelEnabled, getLogger} from "@ui5/logger";
const log = getLogger("Trace");

export function taskStart(taskName: string, taskData?: string, singleTask?: boolean): () => void {
	const startTime = hrtime.bigint();
	return () => {
		const elapsedNs = Number(hrtime.bigint() - startTime);
		const elapsedMs = elapsedNs / 1_000_000;
		const elapsedSec = elapsedNs / 1_000_000_000;
		if (isLogLevelEnabled("perf")) {
			let msg = `${taskName} took `;
			if (elapsedSec >= 1) {
				let format = chalk.bold;
				if (singleTask) {
					format = format.red;
				}
				msg += format(`${elapsedSec.toFixed(2)} s`);
				if (singleTask) {
					msg += format(` ${figures.warning} (slow)`);
				}
			} else {
				let format = chalk;
				if (elapsedMs > 1) {
					format = chalk.bold;
				}
				if (elapsedMs > 500) {
					format = format.yellow;
				}
				msg += format(`${elapsedMs.toFixed(2)} ms`);
			}
			if (taskData) {
				msg += ` - ${taskData}`;
			}
			log.perf(msg);
		}
	};
}
