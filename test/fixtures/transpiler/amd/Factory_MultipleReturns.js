sap.ui.define(["some/module"], function (merge) {
	const otherModule = sap.ui.require("some/other/module");
	if (otherModule) {
		return otherModule;
	}
	return merge;
});
