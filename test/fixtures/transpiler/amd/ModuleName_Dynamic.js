const moduleName = (new Date().getTime() % 2 === 0 ? "My" : "Your") + " Module";
sap.ui.define(moduleName, function () {
	return function () {
		return "MyModuleContent";
	};
});
