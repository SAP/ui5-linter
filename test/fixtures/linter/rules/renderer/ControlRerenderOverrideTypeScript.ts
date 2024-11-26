import Control from "sap/ui/core/Control";
import type { MetadataOptions } from "sap/ui/core/Element";
import RenderManager from "sap/ui/core/RenderManager";

/**
 * @namespace sap.ui.demo.linter.controls
 */
class Example1 extends Control {
	static readonly metadata: MetadataOptions = {}

	rerender() {
		console.log("Overriding rerender method");
		return super.rerender();
	}

	static renderer = {
		apiVersion: 2,
		render: function(rm: RenderManager, control: Example1) {
			rm.openStart("div", control);
			rm.openEnd();
			rm.close("div");
		}
	}
}

/**
 * @namespace sap.ui.demo.linter.controls
 */
class Example2 extends Control {
	static readonly metadata: MetadataOptions = {}

	rerender() {
		console.log("Overriding rerender method without calling super method");
	}

	static renderer = {
		apiVersion: 2,
		render: function(rm: RenderManager, control: Example2) {
			rm.openStart("div", control);
			rm.openEnd();
			rm.close("div");
		}
	}
}

/**
 * @namespace sap.ui.demo.linter.controls
 */
class Example3 extends Control {
	static readonly metadata: MetadataOptions = {}

	rerender = () => {
		console.log("Overriding rerender method without calling super method");
	}

	static renderer = {
		apiVersion: 2,
		render: function(rm: RenderManager, control: Example3) {
			rm.openStart("div", control);
			rm.openEnd();
			rm.close("div");
		}
	}
}

/**
 * @namespace sap.ui.demo.linter.controls
 */
class Example4 extends Control {
	static readonly metadata: MetadataOptions = {}

	rerender = function() {
		console.log("Overriding rerender method without calling super method");
	}

	static renderer = {
		apiVersion: 2,
		render: function(rm: RenderManager, control: Example4) {
			rm.openStart("div", control);
			rm.openEnd();
			rm.close("div");
		}
	}
}

/**
 * @namespace sap.ui.demo.linter.controls
 */
class Example5 extends Control {
	static readonly metadata: MetadataOptions = {}

	static renderer = {
		apiVersion: 2,
		render: function(rm: RenderManager, control: Example5) {
			rm.openStart("div", control);
			rm.openEnd();
			rm.close("div");
		}
	}
}
Example5.prototype.rerender = function() {
	console.log("Overriding rerender method without calling super method");
};

function rerender() {
	console.log("Overriding rerender method without calling super method");
}

/**
 * @namespace sap.ui.demo.linter.controls
 */
class Example6 extends Control {
	static readonly metadata: MetadataOptions = {}

	rerender = rerender

	static renderer = {
		apiVersion: 2,
		render: function(rm: RenderManager, control: Example6) {
			rm.openStart("div", control);
			rm.openEnd();
			rm.close("div");
		}
	}
}
