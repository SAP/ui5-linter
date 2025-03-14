sap.ui.define(function() {
	// Globals via globalThis should also be detected and replaced
	new globalThis.sap.m.Button();

	// Globals via self should also be detected and replaced
	new self.sap.m.Button();
});
