sap.ui.define(["sap/ui/base/Object", "sap/ui/base/Metadata"], function(BaseObject, Metadata) {
	"use strict";

	const MyClassMetadata = function(sClassName, oClassInfo) {
		// call super constructor
		Metadata.apply(this, arguments);
	};
	// chain the prototypes
	MyClassMetadata.prototype = Object.create(Metadata.prototype);
	MyClassMetadata.prototype.constructor = MyClassMetadata;

	const MyClass = BaseObject.extend("my.MyClass", {
		myFunction() {
			return "Hello World";
		}
	}, MyClassMetadata);
	return MyClass;
});
