import Button from "sap/m/Button";

// NOTE: ES Modules (import/export) are currently not processed during autofix, so this won't be fixed
const button1 = new sap.m.Button({
	text: "Hello"
});
const button2 = new Button({
	text: "Hello"
});
