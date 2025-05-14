import ts from "typescript";
import Fix from "./Fix.js";
import {FixMetadata} from "./FixMetadata.js";

export default class FixJquerySapLog extends Fix {
	static create(node: ts.Node): FixJquerySapLog {
		if (!ts.isCallExpression(node)) {
			throw new Error("Invalid node type");
		}
		return new FixJquerySapLog(node);
	}

	constructor(node: ts.Node) {

	}

	getSolutions(solutionGenerator: SolutionGenerator) {

	}

	getPosition() {

	}
}