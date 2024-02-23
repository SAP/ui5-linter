sap.ui.define("sap/m/foo", ["sap/m/Button", "require", "exports", "module"], (Button, require, exports, module) => {
	new Button({
		text: "Hello World",
		press() {
			console.log(sap.ui.require("sap/m/NotLoaded")) // returns undefined
			require(["./Input"], (Input) => {
				console.log(Input);
				console.log(require);
				console.log(exports);
				console.log(module);
			})
			console.log(require("./NotLoaded")) // throws an error
		}
	}).placeAt("content");
});
