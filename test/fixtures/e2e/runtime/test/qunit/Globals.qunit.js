/*global QUnit */
sap.ui.define(() => {
	"use strict";

	QUnit.module("Globals");

	QUnit.test("Control class", function(assert) {
		const HTMLControlClass = sap.ui.core.HTML;
		assert.equal(HTMLControlClass.getMetadata().getName(), "sap.ui.core.HTML");
		assert.notOk(HTMLControlClass instanceof sap.ui.core.HTML, "HTMLControlClass is NOT an instance of sap.ui.core.HTML");
	});

	QUnit.test("Control instance", function(assert) {
		const htmlControl = new sap.ui.core.HTML();
		assert.equal(htmlControl.getMetadata().getName(), "sap.ui.core.HTML");
		assert.ok(htmlControl instanceof sap.ui.core.HTML, "htmlControl is an instance of sap.ui.core.HTML");
	});

	QUnit.test("Library enum", function(assert) {
		assert.equal(sap.ui.core.ValueState.Success, "Success");
		const ComponentLifecycle = sap.ui.core.ComponentLifecycle;
		assert.ok(typeof ComponentLifecycle === "object");
		assert.equal(ComponentLifecycle.Container, "Container");
	});

	QUnit.test("Globals within nested sap.ui.require", function(assert) {
		const done = assert.async();

		sap.ui.require(["sap/ui/core/Component"], function(Component) {

			const htmlControl = new sap.ui.core.HTML();
			assert.equal(htmlControl.getMetadata().getName(), "sap.ui.core.HTML");
			assert.ok(htmlControl instanceof sap.ui.core.HTML, "htmlControl is an instance of sap.ui.core.HTML");

			assert.equal(Component, sap.ui.core.Component, "Existing import should be equal to the global");

			done();
		}, function() {
			assert.ok(false, "sap.ui.require failed");
			done();
		});
	});
});
