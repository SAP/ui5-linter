import ts from "typescript";
import {AmbientModuleCache} from "../AmbientModuleCache.js";
import GlobalsFixHintsGenerator from "./GlobalsFixHintsGenerator.js";
import JquerySapFixHintsGenerator from "./JquerySapFixHintsGenerator.js";
import {FixHints} from "./FixHints.js";

export default class FixHintsGenerator {
	private globalsGenerator: GlobalsFixHintsGenerator;
	private jquerySapGenerator: JquerySapFixHintsGenerator;

	constructor(
		resourcePath: string,
		ambientModuleCache: AmbientModuleCache
	) {
		this.globalsGenerator = new GlobalsFixHintsGenerator(resourcePath, ambientModuleCache);
		this.jquerySapGenerator = new JquerySapFixHintsGenerator();
	}

	public getGlobalsFixHints(node: ts.CallExpression | ts.AccessExpression): FixHints | undefined {
		return this.globalsGenerator.getFixHints(node);
	}

	public getJquerySapFixHints(
		node: ts.CallExpression | ts.AccessExpression
	): FixHints | undefined {
		return this.jquerySapGenerator.getFixHints(node);
	}
}
