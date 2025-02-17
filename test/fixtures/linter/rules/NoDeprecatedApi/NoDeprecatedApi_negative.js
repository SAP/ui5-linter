sap.ui.define([
	"sap/m/upload/UploadSet",
	"sap/ui/thirdparty/jquery",
	"sap/m/library",
	"sap/m/NotificationListItem",
	"sap/ui/test/matchers/Ancestor"
], function(UploadSet, jQuery, mobileLib, NotificationListItem, Ancestor) {

	var uploadSet = new UploadSet({
		noDataText: "No data" // OK: Property 'noDataText' is only deprecated as of 1.121
	});

	jQuery(document).on("touchstart mousedown", function() { // OK: Deprecated jQuery functions should not be checked
		console.log("Hello World!");
	});

	mobileLib.InputType.Text;

	// Matchers are classes but return a function instead of an instance.
	// This is a special case w.r.t. AST nodes, so it should be covered.
	// There is no deprecated API usage in the following line.
	new Ancestor("my-button")(uploadSet);

	new NotificationListItem({
		datetime: "1 year",
		authorName: "Hugo",
		authorPicture: "Hugo.png"
	}).setDatetime("1 month").setAuthorName("Albert").setAuthorPicture("Albert.gif");
});
