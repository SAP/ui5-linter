import {LintResult, LintMessage} from "../linter/LinterContext.js";
import {LintMessageSeverity} from "../linter/messages.js";

export class Markdown {
	format(lintResults: LintResult[], showDetails: boolean, version: string, autofix: boolean, quiet = false): string {
		let totalErrorCount = 0;
		let totalWarningCount = 0;
		let totalFatalErrorCount = 0;

		let findings = "";
		lintResults.forEach(({filePath, messages, errorCount, warningCount, fatalErrorCount}) => {
			if (!errorCount && !warningCount) {
				// Skip files without errors or warnings
				return;
			}
			// Accumulate totals
			totalErrorCount += errorCount;
			totalWarningCount += warningCount;
			totalFatalErrorCount += fatalErrorCount;

			// Add the file path as a section header
			findings += `### ${filePath}\n\n`;
			if (showDetails === true) {
				findings += `| Severity | Rule | Location | Message | Details |\n`;
				findings += `|----------|------|----------|---------|---------|\n`;
			} else {
				findings += `| Severity | Rule | Location | Message |\n`;
				findings += `|----------|------|----------|---------|\n`;
			}

			// Sort messages by severity  (sorting order: fatal-errors, errors, warnings)
			messages.sort((a, b) => {
				// Handle fatal errors first to push them to the bottom
				if (a.fatal !== b.fatal) {
					return a.fatal ? -1 : 1; // Fatal errors go to the top
				}
				// Then, compare by severity
				if (a.severity !== b.severity) {
					return b.severity - a.severity;
				}
				// If severity is the same, compare by line number (handling nulls)
				if ((a.line ?? 0) !== (b.line ?? 0)) {
					return (a.line ?? 0) - (b.line ?? 0);
				}
				// If both severity and line number are the same, compare by column number (handling nulls)
				return (a.column ?? 0) - (b.column ?? 0);
			});

			// Format each message
			messages.forEach((msg) => {
				const severity = this.formatSeverity(msg.severity, msg.fatal);
				const location = this.formatLocation(msg.line, msg.column);
				const rule = this.formatRuleId(msg.ruleId, version);
				let details;
				if (showDetails) {
					details = ` ${this.formatMessageDetails(msg)} |`;
				} else {
					details = "";
				}

				findings += `| ${severity} | ${rule} | \`${location}\` | ${msg.message} |${details}\n`;
			});

			findings += "\n";
		});

		let summary = "## Summary\n\n";
		const errorsText = `${totalErrorCount} ${totalErrorCount === 1 ? "error" : "errors"}`;
		let warningsText = "";
		if (!quiet) {
			warningsText = `, ${totalWarningCount} ${totalWarningCount === 1 ? "warning" : "warnings"}`;
		}

		const totalCount = quiet ? totalErrorCount : totalErrorCount + totalWarningCount;
		const problemsText = `${totalCount} ${totalCount === 1 ? "problem" : "problems"}`;

		summary += `> ${problemsText} (${errorsText}${warningsText})  \n`;

		if (totalFatalErrorCount) {
			const fatalErrorsText = `${totalFatalErrorCount === 1 ? "error" : "errors"}`;
			summary += `> **${totalFatalErrorCount} fatal ${fatalErrorsText}**\n`;
		}
		if (!autofix && (totalErrorCount + totalWarningCount > 0)) {
			summary += "> Run `ui5lint --fix` to resolve all auto-fixable problems\n\n";
		}

		if (findings) {
			findings = `## Findings\n${findings}`;
		}

		let output = `# UI5 Linter Report
${summary}
${findings}`;

		// Suggest using the details option if not all details are shown
		if (!showDetails && (totalErrorCount + totalWarningCount) > 0) {
			output += "**Note:** Use `ui5lint --details` to show more information about the findings.\n";
		}
		return output;
	}

	// Formats the severity of the lint message using appropriate emoji
	private formatSeverity(severity: LintMessageSeverity, fatal: LintMessage["fatal"]): string {
		if (fatal === true) {
			return "Fatal Error";
		} else if (severity === LintMessageSeverity.Warning) {
			return "Warning";
		} else if (severity === LintMessageSeverity.Error) {
			return "Error";
		} else {
			throw new Error(`Unknown severity: ${LintMessageSeverity[severity]}`);
		}
	}

	// Formats the location of the lint message (line and column numbers)
	private formatLocation(line?: number, column?: number): string {
		// Default to 0 if line or column are not provided
		return `${line ?? 0}:${column ?? 0}`;
	}

	// Formats additional message details if `showDetails` is true
	private formatMessageDetails(msg: LintMessage): string {
		if (!msg.messageDetails) {
			return "";
		}
		// Replace multiple spaces or newlines with a single space for clean output
		return `${msg.messageDetails.replace(/\s\s+|\n/g, " ")}`;
	}

	// Formats the rule of the lint message (ruleId and link to rules.md)
	private formatRuleId(ruleId: string, version: string): string {
		return `[${ruleId}](https://github.com/UI5/linter/blob/v${version}/docs/Rules.md#${ruleId})`;
	}
}
