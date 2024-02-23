import Controller from "sap/ui/core/mvc/Controller";
export default class BaseController extends Controller {
	attachButtonTap() {
		var btn = this.getView().byId("button-control");
		btn.attachTap(function () {
			console.log("Tapped");
		});
	}
}
