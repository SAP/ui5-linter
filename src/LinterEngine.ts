import {lintProject} from "./linter/linter.js";
import {LinterOptions, LintResult} from "./linter/LinterContext.js";

export default class LinterEngine {
	async lintProject(linterOptions: LinterOptions): Promise<LintResult[]> {
		return lintProject(linterOptions);
	}
}
