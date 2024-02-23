import Controller from "sap/ui/core/mvc/Controller";
import Button from "sap/m/Button";
export default class BaseController extends Controller {
	createButton1() {
		var btn = this.getNewButton();
		btn.attachTap(function () {
			console.log("Tapped");
		});
		return btn;
	}
	createButton2() {
		this.getNewButton().attachTap(function () {
			console.log("Tapped");
		});
	}
	getNewButton() {
		const newButton = new Button({
			blocked: true
		});
		return newButton;
	}
}
