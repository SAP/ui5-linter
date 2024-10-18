const factory = function (Controller, someModule) {
	const MyController = Controller.extend("MyController", {});

	if (someModule) {
		return true;
	} else {
		return false;
	}
};

sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"some/module"
	],
	factory
);
