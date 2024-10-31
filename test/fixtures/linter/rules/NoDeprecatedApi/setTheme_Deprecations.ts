import Theming from "sap/ui/core/Theming";

export default class SetThemeController {
	init(): void {
		Theming.setTheme("sap_belize"); // positive finding
		Theming.setTheme("sap_bluecrystal"); // positive finding
		Theming.setTheme("sap_hcb"); // positive finding
		Theming.setTheme("sap_horizon"); // negative finding
	}
};
