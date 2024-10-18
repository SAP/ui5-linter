sap.ui.define(["sap/ui/base/Object", "some/module"], (BaseObject, someModule) => {

	BaseObject.extend("my.Class", {});

	if (someModule) {
		return true;
	} else {
		return false;
	}
});
