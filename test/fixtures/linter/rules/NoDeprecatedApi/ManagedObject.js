sap.ui.define(["sap/ui/core/Control", "sap/m/DateTimeInputType"], 
	function (Control, DateTimeInputType) {
	var FancyText = Control.extend("sap.fancy.Text", {
		metadata: {
			interfaces: ["sap.fancy.IDeprecatedInterface"],
			library: "sap.fancy",
			properties: {
				text: {type: "string", group: "Data", defaultValue: "", bindable: "bindable"},
				textShort: "sap.f.AvatarShape",
				textDirection: {type: "sap.m.DateTimeInputType", group: "Appearance", defaultValue: DateTimeInputType.DateTime},
				textDirectionB: {type: "sap.m.DateTimeInputType", group: "Appearance", defaultValue: "Date"},
				textAlign: {type: "sap.ui.core.TextAlign", group: "Appearance", defaultValue: TextAlign.DeprecatedLeft},
				textAlignB: {type: "sap.ui.core.TextAlign", group: "Appearance", defaultValue: "DeprecatedLeft"},
			},
			aggregations: {
				myagg: {type: "sap.m.DepreactedLink", multiple: false, visibility: "hiddenDeprecated"},
				myaggShort: "sap.m.DepreactedLink",
				tooltip: {type: "sap.ui.core.TooltipBase", altTypes: ["string", "sap.ui.core.DeprecatedType"], multiple: false},
				beginColumnPages: {
					type: "sap.ui.core.Control",
					multiple: true,
					forwarding: {
						getter: "_getBeginColumn",
						aggregation: "deprecatedPages",
					},
				},
			},
			associations: {
				initialBeginColumnPage: {type: "sap.ui.core.DepreactedLink", multiple: false},
				initialBeginColumnPageShort: "sap.ui.core.DepreactedLink",
			},
			events: {
				eventA: {
					parameters: {
						layout: {
							type: "sap.f.DeprecatedType",
						},
					},
				},
				eventB: {
					parameters: {
						layout: {
							type: "Promise<sap.f.DeprecatedType>",
						},
					},
				},
				eventC: {
					parameters: {
						layout: "Promise<sap.f.DeprecatedType>",
					},
				},
			},
		},
	});

	FancyText.prototype._getBeginColumn = function () {
		return new FancyMultiPage({
			metadata: {
				aggregations: {
					deprecatedPages: {type: "sap.m.Page", multiple: false, visibility: true},
				},
			},
		});
	};
});
