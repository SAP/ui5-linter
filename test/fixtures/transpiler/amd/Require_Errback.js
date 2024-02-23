sap.ui.require(["some/module"], (module) => {
	module.renderButton();
}, (err) => {
	console.log(err);
});
