import {Argv, ArgumentsCamelCase, CommandModule, MiddlewareFunction} from "yargs";
import path from "node:path";
import {lintProject} from "../linter/linter.js";
import {Text} from "../formatter/text.js";
import {Json} from "../formatter/json.js";
import {Coverage} from "../formatter/coverage.js";
import {writeFile} from "node:fs/promises";
import baseMiddleware from "./middlewares/base.js";
import chalk from "chalk";
import {isLogLevelEnabled} from "@ui5/logger";
import ConsoleWriter from "@ui5/logger/writers/Console";

export interface LinterArg {
	coverage: boolean;
	filePaths?: string[];
	details: boolean;
	format: string;
}

// yargs type defition is missing the "middelwares" property for the CommandModule type
interface FixedCommandModule<T, U> extends CommandModule<T, U> {
	middlewares: MiddlewareFunction<U>[];
}

const lintCommand: FixedCommandModule<object, LinterArg> = {
	command: "$0",
	describe: "Runs linter",
	handler: handleLint,
	middlewares: [baseMiddleware],
	builder: function (args: Argv<object>): Argv<LinterArg> {
		args.usage("Usage: $0 [options]")
			.option("file-paths", {
				describe: "",
				type: "string",
			})
			.array("file-paths")
			.option("coverage", {
				describe: "Whether to provide a coverage report",
				type: "boolean",
				default: false,
			})
			.option("details", {
				describe: "Print complementary information for each finding, if available",
				type: "boolean",
				default: false,
			})
			.option("loglevel", {
				alias: "log-level",
				describe: "Set the logging level",
				default: "info",
				type: "string",
				choices: ["silent", "error", "warn", "info", "perf", "verbose", "silly"],
			})
			.option("verbose", {
				describe: "Enable verbose logging.",
				default: false,
				type: "boolean",
			})
			.option("perf", {
				describe: "Enable performance measurements and related logging.",
				default: false,
				type: "boolean",
			})
			.option("silent", {
				describe: "Disable all log output.",
				default: false,
				type: "boolean",
			})
			.option("format", {
				alias: "f",
				describe: "Set the output format for the linter result",
				default: "stylish",
				type: "string",
				choices: ["stylish", "json"],
			})
			.coerce([
				// base.js
				"log-level",
			], (arg: LinterArg[]) => {
				// If an option is specified multiple times, yargs creates an array for all the values,
				// independently of whether the option is of type "array" or "string".
				// This is unexpected for options listed above, which should all only have only one
				// definitive value. The yargs behavior could be disabled by using the parserConfiguration
				// "duplicate-arguments-array": true. However, yargs would then cease to create arrays for
				// those options where we *do* expect the automatic creation of arrays in case the option
				// is specified multiple times. Like "--include-task".
				// Also see https://github.com/yargs/yargs/issues/1318
				// Note: This is not necessary for options of type "boolean"
				if (Array.isArray(arg)) {
					// If the option is specified multiple times, use the value of the last option
					return arg[arg.length - 1];
				}
				return arg;
			})
			.example("ui5lint --coverage",
				"Execute ui5lint with coverage enabled")
			.example("ui5lint --file-paths /path/to/resources",
				"Execute command with scope of file-paths");

		return args as Argv<LinterArg>;
	},
};

async function handleLint(argv: ArgumentsCamelCase<LinterArg>) {
	const {
		coverage,
		filePaths,
		details,
		format,
	} = argv;

	let profile;
	if (process.env.UI5LINT_PROFILE) {
		profile = await import("./utils/profile.js");
		await profile.start();
	}

	const reportCoverage = !!(process.env.UI5LINT_COVERAGE_REPORT ?? coverage);

	const res = await lintProject({
		rootDir: path.join(process.cwd()),
		pathsToLint: filePaths?.map((filePath) => path.resolve(process.cwd(), filePath)),
		reportCoverage,
		includeMessageDetails: details,
	});

	if (reportCoverage) {
		const coverageFormatter = new Coverage();
		await writeFile("ui5lint-report.html", await coverageFormatter.format(res));
	}

	if (format === "json") {
		const jsonFormatter = new Json();
		process.stdout.write(jsonFormatter.format(res, details));
		process.stdout.write("\n");
	} else if (format === "" || format === "stylish") {
		const textFormatter = new Text();
		process.stderr.write(textFormatter.format(res, details));
	}
	// Stop profiling after CLI finished execution
	if (profile) {
		await profile.stop();
	}

	if (res.some((file) => !!file.errorCount)) {
		// At least one error is reported. Exit with non-zero exit code.
		process.exitCode = 1;
	}
}

export default function base(cli: Argv) {
	cli
		.showHelpOnFail(true)
		.strict(true)
		.fail(function (msg, err) {
			if (err) {
				ConsoleWriter.stop();
				// Exception
				if (isLogLevelEnabled("error")) {
					process.stderr.write("\n");
					process.stderr.write(chalk.bold.red("⚠️  Process Failed With Error\n"));

					process.stderr.write("\n");
					process.stderr.write(chalk.underline("Error Message:\n"));
					process.stderr.write(err.message + "\n");

					// Unexpected errors should always be logged with stack trace
					const unexpectedErrors = ["SyntaxError", "ReferenceError", "TypeError"];
					if (unexpectedErrors.includes(err.name) || isLogLevelEnabled("verbose")) {
						process.stderr.write("\n");
						if (err.stack) {
							process.stderr.write(chalk.underline("Stack Trace:\n"));
							process.stderr.write(err.stack + "\n");
							process.stderr.write("\n");
						}
						if (err.cause instanceof Error && err.cause.stack) {
							process.stderr.write(chalk.underline("Error Cause Stack Trace:\n"));
							process.stderr.write(err.cause.stack + "\n");
							process.stderr.write("\n");
						}
						process.stderr.write(
							chalk.dim(
								`If you think this is an issue of the ui5-linter, you might report it using the ` +
								`following URL: `) +
								chalk.dim.bold.underline(`https://github.com/SAP/ui5-linter/issues/new/choose`) + "\n");
					} else {
						process.stderr.write("\n");
						process.stderr.write(chalk.dim(`For details, execute the same command again with an` +
						` additional '--verbose' parameter`) + "\n");
					}
				}
			} else {
				// Yargs error
				process.stderr.write(chalk.bold.yellow("Command Failed:\n"));
				process.stderr.write(`${msg}\n`);
				process.stderr.write("\n");
				process.stderr.write(chalk.dim(`See 'ui5lint --help'`) + "\n");
			}
			process.exit(2);
		});

	cli.command(lintCommand);
}
