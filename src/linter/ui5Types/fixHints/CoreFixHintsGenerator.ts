import ts from "typescript";
import type {FixHints} from "./FixHints.js";

export default class CoreFixHintsGenerator {
	getFixHints(node: ts.CallExpression | ts.AccessExpression): FixHints | undefined {
		return;
	}
}
