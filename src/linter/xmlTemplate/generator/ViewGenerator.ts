import AbstractGenerator from "./AbstractGenerator.js";
import {ControlDeclaration} from "../Parser.js";

export default class ViewGenerator extends AbstractGenerator {
	writeRootControl(controlInfo: ControlDeclaration) {
		this._body.write(`export default `);
		this.writeControl(controlInfo);
	}
}
