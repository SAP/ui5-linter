// This file is generated by the createTypes script.

declare module "sap/f/AvatarGroupType" {
	import {AvatarGroupType} from "sap/f/library";

	/**
	 * Group modes for the {@link sap.f.AvatarGroup} control.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'AvatarGroupType'.
	 *
	 * @public
	 * @since 1.73
	*/
	export default AvatarGroupType;
}

declare module "sap/f/CardBadgeVisibilityMode" {
	import {CardBadgeVisibilityMode} from "sap/f/library";

	/**
	 * Enumeration for different visibility options for the card badge.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'CardBadgeVisibilityMode'.
	 *
	 * @public
	 * @since 1.128
	*/
	export default CardBadgeVisibilityMode;
}

declare module "sap/f/cards/HeaderPosition" {
	import {cards} from "sap/f/library";

	/**
	 * Different options for the position of the header in controls that implement the {@link sap.f.ICard} interface.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'cards.HeaderPosition'.
	 *
	 * @public
	 * @since 1.65
	*/
	export default cards.HeaderPosition;
}

declare module "sap/f/cards/NumericHeaderSideIndicatorsAlignment" {
	import {cards} from "sap/f/library";

	/**
	 * Different options for the alignment of the side indicators in the numeric header.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'cards.NumericHeaderSideIndicatorsAlignment'.
	 *
	 * @public
	 * @since 1.96
	*/
	export default cards.NumericHeaderSideIndicatorsAlignment;
}

declare module "sap/f/cards/SemanticRole" {
	import {cards} from "sap/f/library";

	/**
	 * Different options for the semantic role in controls that implement the {@link sap.f.ICard} interface.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'cards.SemanticRole'.
	 *
	 * @experimental
	 * @public
	 * @since 1.131
	*/
	export default cards.SemanticRole;
}

declare module "sap/f/DynamicPageTitleArea" {
	import {DynamicPageTitleArea} from "sap/f/library";

	/**
	 * Defines the areas within the <code>sap.f.DynamicPageTitle</code> control.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'DynamicPageTitleArea'.
	 *
	 * @deprecated (since 1.54) - Consumers of the {@link sap.f.DynamicPageTitle} control should now use the <code>areaShrinkRatio</code> property instead of the <code>primaryArea</code> property.
	 * @public
	 * @since 1.50
	*/
	export default DynamicPageTitleArea;
}

declare module "sap/f/DynamicPageTitleShrinkRatio" {
	import {DynamicPageTitleShrinkRatio} from "sap/f/library";

	/**
	 * A string type that represents the shrink ratios of the areas within the <code>sap.f.DynamicPageTitle</code>.
	 *
	 * @public
	 * @since 1.54
	*/
	export default DynamicPageTitleShrinkRatio;
}

declare module "sap/f/LayoutType" {
	import {LayoutType} from "sap/f/library";

	/**
	 * Layouts, representing the number of columns to be displayed and their relative widths for a {@link sap.f.FlexibleColumnLayout} control.
	 * 
	 * Each layout has a default predefined ratio for the three columns, depending on device size. Based on the device and layout, some columns are hidden. For more information, refer to the ratios (in %) for each value, listed below: (dash "-" means non-accessible columns).
	 * 
	 * <b>Notes:</b> <ul> <li>The user is allowed to customize the default ratio by dragging the column separators to resize the columns. The user preferences are then internally saved (in browser localStorage) and automatically re-applied whenever the user re-visits the same layout. </li> <li>Please note that on a phone device, due to the limited screen size, only one column can be displayed at a time. For all two-column layouts, this column is the <code>Mid</code> column, and for all three-column layouts - the <code>End</code> column, even though the respective column may be hidden on desktop and tablet for that particular layout. Therefore some of the names (such as <code>ThreeColumnsMidExpandedEndHidden</code> for example) are representative of the desktop scenario only. </li> </ul>
	 * 
	 * For more information, see {@link topic:3b9f760da5b64adf8db7f95247879086 Types of Layout} in the documentation.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'LayoutType'.
	 *
	 * @public
	 * @since 1.46
	*/
	export default LayoutType;
}

declare module "sap/f/NavigationDirection" {
	import {NavigationDirection} from "sap/f/library";

	/**
	 * Enumeration for different navigation directions.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'NavigationDirection'.
	 *
	 * @public
	 * @since 1.85
	*/
	export default NavigationDirection;
}

declare module "sap/f/SidePanelPosition" {
	import {SidePanelPosition} from "sap/f/library";

	/**
	 * Enumeration for different SidePanel position.
	 * 
	 * This enum is part of the 'sap/f/library' module export and must be accessed by the property 'SidePanelPosition'.
	 *
	 * @public
	 * @since 1.104
	*/
	export default SidePanelPosition;
}
