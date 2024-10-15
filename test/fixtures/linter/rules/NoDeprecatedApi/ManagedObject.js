sap.ui.define(["sap/ui/base/ManagedObject", "sap/m/library", "mycustom/lib/FancyMultiPage"], 
	function (ManagedObject, library, FancyMultiPage) {
	var DateTimeInputType = library.DateTimeInputType;
	var FrameType = library.FrameType;
	return ManagedObject.extend("sap.fancy.Text", {
		metadata: {
			// sap.ui.commons.FormattedTextViewControl: deprecated
			interfaces: ["sap.ui.commons.FormattedTextViewControl"],
			library: "sap.fancy",
			properties: {
				text: {type: "string", group: "Data", defaultValue: "", bindable: "bindable"},
				textShort: "sap.f.AvatarShape",
				// sap.m.DateTimeInputType: deprecated, DateTimeInputType.DateTime: deprecated
				textDirection: {type: "sap.m.DateTimeInputType", group: "Appearance", defaultValue: DateTimeInputType.DateTime},
				// sap.m.DateTimeInputType: deprecated, "Date": deprecated
				textDirectionB: {type: "sap.m.DateTimeInputType", group: "Appearance", defaultValue: "Date"},
				// sap.m.FrameType: NOT deprecated, sap.m.FrameType.TwoThirds: deprecated
				textAlign: {type: "sap.m.FrameType", group: "Appearance", defaultValue: FrameType.TwoThirds},
				// sap.m.FrameType: NOT deprecated, "TwoThirds": deprecated
				textAlignB: {type: "sap.m.FrameType", group: "Appearance", defaultValue: "TwoThirds"},
			},
			aggregations: {
				// sap.f.Avatar: deprecated
				myagg: {type: "sap.f.Avatar", multiple: false, visibility: "hiddenDeprecated"},
				// sap.f.Avatar: deprecated
				myaggShort: "sap.f.Avatar",
				// sap.f.IllustratedMessageSize DataType: deprecated
				tooltip: {type: "sap.ui.core.TooltipBase", altTypes: ["string", "sap.f.IllustratedMessageSize"], multiple: false},
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
				// sap.f.Avatar: deprecated
				initialBeginColumnPage: {type: "sap.f.Avatar", multiple: false},
				// sap.f.Avatar: deprecated
				initialBeginColumnPageShort: "sap.f.Avatar",
			},
			events: {
				eventA: {
					parameters: {
						layout: {
							type: "sap.f.DynamicPageTitleArea", // deprecated
						},
					},
				},
				eventB: {
					parameters: {
						layout: {
							type: "Promise<sap.f.DynamicPageTitleArea>", // deprecated
						},
					},
				},
				eventC: {
					parameters: {
						layout: "Promise<sap.f.AvatarShape>", // deprecated
					},
				},
			},
		},
	});
});
