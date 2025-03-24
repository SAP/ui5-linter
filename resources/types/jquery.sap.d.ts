// General deprecation of jQuery.sap namespace
interface JQueryStatic {
	/**
	 * @deprecated since 1.58. To avoid usage of global variables in general, please
	 * do not use the jQuery.sap namespace any longer. Most of the jQuery.sap functionalities
	 * are replaced by alternative modules which can be found in the API doc.
	 */
	sap: object;
}

// Add exports of all jquery.sap.* modules (except for "jquery.sap.promise" which does not export jQuery)
declare module "jquery.sap.act" {
	export default jQuery;
}
declare module "jquery.sap.dom" {
	export default jQuery;
}
declare module "jquery.sap.encoder" {
	export default jQuery;
}
declare module "jquery.sap.events" {
	export default jQuery;
}
declare module "jquery.sap.global" {
	export default jQuery;
}
declare module "jquery.sap.history" {
	export default jQuery;
}
declare module "jquery.sap.keycodes" {
	export default jQuery;
}
declare module "jquery.sap.mobile" {
	export default jQuery;
}
declare module "jquery.sap.properties" {
	export default jQuery;
}
declare module "jquery.sap.resources" {
	export default jQuery;
}
declare module "jquery.sap.script" {
	export default jQuery;
}
declare module "jquery.sap.sjax" {
	export default jQuery;
}
declare module "jquery.sap.storage" {
	export default jQuery;
}
declare module "jquery.sap.strings" {
	export default jQuery;
}
declare module "jquery.sap.stubs" {
	export default jQuery;
}
declare module "jquery.sap.trace" {
	export default jQuery;
}
declare module "jquery.sap.ui" {
	export default jQuery;
}
declare module "jquery.sap.xml" {
	export default jQuery;
}
