sap.ui.define(["sap/m/Image", "sap/m/ImageRenderer"], function (Image, ImageRenderer) {
	var LightBox = Image.extend("Lightbox", {
		metadata: {},
		renderer: ImageRenderer.render
	});
	
	return Lightbox;
});
