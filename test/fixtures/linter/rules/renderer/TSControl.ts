import Control from "sap/ui/core/Control";
import RenderManager from "sap/ui/core/RenderManager";
import type { MetadataOptions } from "sap/ui/core/Element";

export class Test1 extends Control {
	static readonly metadata: MetadataOptions = {
		properties: {
			text: "string",
			tag: "string",
		},
		aggregations: {
			children: { type: "sap.ui.core.Control", multiple: true },
		},
		defaultAggregation: "children",
	};

	static renderer = {
		apiVersion: 1,
		render: (rm: RenderManager, control: HTMLElement) => {},
	};
}

export class Test2 extends Control {
	static readonly metadata: MetadataOptions = {
		properties: {
			text: "string",
			tag: "string",
		},
		aggregations: {
			children: { type: "sap.ui.core.Control", multiple: true },
		},
		defaultAggregation: "children",
	};

	static renderer = {
		render: (rm: RenderManager, control: HTMLElement) => {},
	};
}

export class Test3 extends Control {
	static readonly metadata: MetadataOptions = {
		properties: {
			text: "string",
			tag: "string",
		},
		aggregations: {
			children: { type: "sap.ui.core.Control", multiple: true },
		},
		defaultAggregation: "children",
	};

	static renderer = (rm: RenderManager, control: HTMLElement) => {};
}

export class Test4 extends Control {
	static readonly metadata: MetadataOptions = {
		properties: {
			text: "string",
			tag: "string",
		},
		aggregations: {
			children: { type: "sap.ui.core.Control", multiple: true },
		},
		defaultAggregation: "children",
	};

	renderer = {
		apiVersion: 2,
		render: (rm: RenderManager, control: HTMLElement) => {},
	};
}