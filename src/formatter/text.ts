import chalk from "chalk";
import {LintMessageSeverity, LintResult, LintMessage} from "../detectors/AbstractDetector.js";

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
	const lineStr = (line === undefined ? "?" : line.toString()).padStart(lineInfoLength, " ");
	const columnStr = (column === undefined ? "?" : column.toString()).padEnd(columnInfoLength, " ");

	return chalk.dim(`${lineStr}:${columnStr}`);
}

export class Text {
	#buffer = "";

	format(lintResults: LintResult[], showDetails: boolean) {
		this.#writeln("");
		this.#writeln(`## UI5Lint Report (${new Date().toLocaleString()}) ##`);
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

			this.#writeln(chalk.inverse(filePath));

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

			let addNewLineAfterModule = true;
			// Sort rules alphabetically
			Array.from(rules.keys()).sort((a, b) => {
				return a.localeCompare(b);
			}).forEach((ruleId) => {
				const messages = rules.get(ruleId);
				if (messages) {
					this.#writeln(chalk.bold(`  ${ruleId} (${messages.length})`));
					messages.forEach((msg) => {
						const messageDetails = (showDetails && msg.messageDetails) ?
								(`\n      ${chalk.white.bold("Details:")}\n      ` +
								`${chalk.italic(msg.messageDetails.replaceAll("\n", "\n      "))}`) :
							"";

						this.#writeln(
							`    ${formatLocation(msg.line, msg.column, lineInfoLength, columnInfoLength)} ` +
							`${formatSeverity(msg.severity)} ` +
							`${msg.message}` +
							`${messageDetails}`);

						addNewLineAfterModule = true;
						if (messageDetails) {
							this.#writeln("");
							addNewLineAfterModule = false;
						}
					});
				}
			});

			if (addNewLineAfterModule) {
				this.#writeln("");
			}
		});

		this.#writeln(
			`${totalErrorCount + totalWarningCount} problems ` +
			`(${totalErrorCount} errors, ${totalWarningCount} warnings)`);
		if (totalFatalErrorCount) {
			this.#writeln(`${totalFatalErrorCount} fatal errors`);
		}

		if (!showDetails && (totalErrorCount + totalWarningCount + totalFatalErrorCount) > 0) {
			this.#writeln("");
			this.#writeln(chalk.dim.bold("Note: ") +
			chalk.dim(`Use "ui5lint --details" to show more information about the findings`));
		}

		return this.#buffer;
	}

	#write(str: string) {
		this.#buffer += str;
	}

	#writeln(str: string) {
		this.#buffer += str + "\n";
	}
}
