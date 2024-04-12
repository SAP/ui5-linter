sap.ui.require(["my/module"], (Module) => {
	return Module;
}, function (err) {
	console.log(err);
});

var err = function (err) {
	console.log(err);
};

sap.ui.require(["my/module"], (Module) => {
	return Module;
}, err);
