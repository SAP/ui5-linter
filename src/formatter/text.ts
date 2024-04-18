import chalk from "chalk";
import path from "node:path";
import {LintMessageSeverity, LintResult, LintMessage} from "../linter/LinterContext.js";

function formatSeverity(severity: LintMessageSeverity) {
	if (severity === LintMessageSeverity.Error) {
		return chalk.red("error");
	} else if (severity === LintMessageSeverity.Warning) {
		return chalk.yellow("warning");
	} else {
		throw new Error(`Unknown severity: ${LintMessageSeverity[severity]}`);
	}
}

function formatLocation(line: LintMessage["line"], column: LintMessage["column"],
	lineInfoLength: number, columnInfoLength: number) {
	const lineStr = (line === undefined ? "0" : line.toString()).padStart(lineInfoLength, " ");
	const columnStr = (column === undefined ? "0" : column.toString()).padEnd(columnInfoLength, " ");

	return chalk.dim(`${lineStr}:${columnStr}`);
}

export class Text {
	#buffer = "";

	format(lintResults: LintResult[], showDetails: boolean) {
		this.#writeln(`UI5 linter report:`);
		this.#writeln("");
		let totalErrorCount = 0;
		let totalWarningCount = 0;
		let totalFatalErrorCount = 0;
		// Sort files alphabetically
		lintResults.sort((a, b) => {
			return a.filePath.localeCompare(b.filePath);
		});
		lintResults.forEach(({filePath, messages, errorCount, warningCount, fatalErrorCount}) => {
			if (!errorCount && !warningCount) {
				return;
			}
			totalErrorCount += errorCount;
			totalWarningCount += warningCount;
			totalFatalErrorCount += fatalErrorCount;

			this.#writeln(chalk.inverse(path.resolve(process.cwd(), filePath)));

			// Group messages by rule
			const rules = new Map<string, LintMessage[]>();
			let maxLine = 0; // Needed for formatting
			let maxColumn = 0; // Needed for formatting
			messages.forEach((msg) => {
				const entry = rules.get(msg.ruleId);
				if (entry) {
					entry.push(msg);
				} else {
					rules.set(msg.ruleId, [msg]);
				}
				if (msg.line && msg.line > maxLine) {
					maxLine = msg.line;
				}
				if (msg.column && msg.column > maxColumn) {
					maxColumn = msg.column;
				}
			});

			const lineInfoLength = maxLine.toString().length;
			const columnInfoLength = maxColumn.toString().length;

			// Sort by line, then by column. Use 0 if not set.
			messages.sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0));

			messages.forEach((msg) => {
				const formattedLocation =
					formatLocation(msg.line, msg.column, lineInfoLength, columnInfoLength);

				const messageDetails = (showDetails && msg.messageDetails) ?
						(`\n  ${formattedLocation}   ${chalk.white.bold("Details:")} ` +
						`${chalk.italic(msg.messageDetails.replaceAll("\n", " "))}`) :
					"";

				this.#writeln(
					`  ${formattedLocation} ` +
					`${formatSeverity(msg.severity)} ` +
					`${msg.message}` +
					`${messageDetails}`);
			});

			this.#writeln("");
		});

		let summaryColor = chalk.green;
		if (totalErrorCount > 0) {
			summaryColor = chalk.red;
		} else if (totalWarningCount > 0) {
			summaryColor = chalk.yellow;
		}

		this.#writeln(
			summaryColor(
				`${totalErrorCount + totalWarningCount} problems ` +
				`(${totalErrorCount} errors, ${totalWarningCount} warnings)`
			)
		);
		if (totalFatalErrorCount) {
			this.#writeln(summaryColor(`${totalFatalErrorCount} fatal errors`));
		}

		if (!showDetails && (totalErrorCount + totalWarningCount + totalFatalErrorCount) > 0) {
			this.#writeln("");
			this.#writeln(chalk.dim.bold("Note: ") +
			chalk.dim(`Use "ui5lint --details" to show more information about the findings`));
		}

		return this.#buffer;
	}

	// eslint-disable-next-line no-unused-private-class-members
	#write(str: string) {
		this.#buffer += str;
	}

	#writeln(str: string) {
		this.#buffer += str + "\n";
	}
}
