sap.ui.define(["library/with/custom/paths/library", "library/with/custom/paths/Example", "sap/ui/model/odata/ODataModel"], function (library, Example) {
	"use strict";

	// refer to library types
	var ExampleColor = library.ExampleColor;

	// create a new instance of the Example control and
	// place it into the DOM element with the id "content"
	const exampleControlInstance = new Example({
		text: "Example",
		color: ExampleColor.Highlight,
		press: function (event) {
			alert(event.getSource());
		}
	});
	exampleControlInstance.placeAt("content");

	// Detection of deprecated control API usage on custom control
	exampleControlInstance.getBlocked();
});
