// CodeQL code scan complains about this file being broken.
// This is a case we test for the config manager. So, wrapping it in a JSON.parse to avoid the error there,
// but keep the test case valid.
module.exports = JSON.parse(`{
	"ignores": [
		"test/**/*",
		"!test/sap/m/visual/Wizard.spe`);
