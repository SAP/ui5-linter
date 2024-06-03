declare module "sap/uxap/BlockBaseColumnLayout" {
	import {BlockBaseColumnLayout} from "sap/uxap/library";

	/**
	 * Used by the <code>BlockBase</code> control to define how many columns should it be assigned by the <code>objectPageSubSection</code>. The allowed values can be auto (subsection assigned a number of columns based on the parent objectPageLayout subsectionLayout property), 1, 2, 3 or 4 (This may not be a valid value for some <code>subSectionLayout</code>, for example, asking for 3 columns in a 2 column layout would raise warnings).
	 *
	 * @public
	*/
	export default BlockBaseColumnLayout;
}

declare module "sap/uxap/BlockBaseFormAdjustment" {
	import {BlockBaseFormAdjustment} from "sap/uxap/library";

	/**
	 * Used by the <code>BlockBase</code> control to define if it should do automatic adjustment of its nested forms.
	 *
	 * @public
	*/
	export default BlockBaseFormAdjustment;
}

declare module "sap/uxap/Importance" {
	import {Importance} from "sap/uxap/library";

	/**
	 * Used by the <code>ObjectSectionBase</code> control to define the importance of the content contained in it.
	 *
	 * @public
	 * @since 1.32.0
	*/
	export default Importance;
}

declare module "sap/uxap/ObjectPageConfigurationMode" {
	import {ObjectPageConfigurationMode} from "sap/uxap/library";

	/**
	 * Used by the <code>sap.uxap.component.Component</code> how to initialize the <code>ObjectPageLayout</code> sections and subsections.
	 *
	 * @public
	*/
	export default ObjectPageConfigurationMode;
}

declare module "sap/uxap/ObjectPageHeaderDesign" {
	import {ObjectPageHeaderDesign} from "sap/uxap/library";

	/**
	 * Used by the <code>ObjectPageHeader</code> control to define which design to use.
	 *
	 * @public
	*/
	export default ObjectPageHeaderDesign;
}

declare module "sap/uxap/ObjectPageHeaderPictureShape" {
	import {ObjectPageHeaderPictureShape} from "sap/uxap/library";

	/**
	 * Used by the <code>ObjectPageHeader</code> control to define which shape to use for the image.
	 *
	 * @public
	*/
	export default ObjectPageHeaderPictureShape;
}

declare module "sap/uxap/ObjectPageSubSectionLayout" {
	import {ObjectPageSubSectionLayout} from "sap/uxap/library";

	/**
	 * Used by the <code>ObjectPagSubSection</code> control to define which layout to apply.
	 *
	 * @public
	*/
	export default ObjectPageSubSectionLayout;
}

declare module "sap/uxap/ObjectPageSubSectionMode" {
	import {ObjectPageSubSectionMode} from "sap/uxap/library";

	/**
	 * Used by the <code>ObjectPageLayout</code> control to define which layout to use (either Collapsed or Expanded).
	 *
	 * @public
	*/
	export default ObjectPageSubSectionMode;
}
