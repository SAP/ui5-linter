// This project is used to test the linter with the namespace of an OpenUI5 project.

sap.ui.require([
	"sap/f/Avatar",
	"sap/m/DateTimeInput"
], (Avatar, DateTimeInput) => {
	new Avatar();
	new DateTimeInput();
});
