declare module "sap/ui/core/AccessibleLandmarkRole" {
	import {AccessibleLandmarkRole} from "sap/ui/core/library";

	/**
	 * Defines the accessible landmark roles for ARIA support. This enumeration is used with the AccessibleRole control property. For more information, go to "Roles for Accessible Rich Internet Applications (WAI-ARIA Roles)" at the www.w3.org homepage.
	 *
	 * @public
	*/
	export default AccessibleLandmarkRole;
}

declare module "sap/ui/core/AccessibleRole" {
	import {AccessibleRole} from "sap/ui/core/library";

	/**
	 * Defines the accessible roles for ARIA support. This enumeration is used with the AccessibleRole control property. For more information, goto "Roles for Accessible Rich Internet Applications (WAI-ARIA Roles)" at the www.w3.org homepage.
	 *
	 * @public
	*/
	export default AccessibleRole;
}

declare module "sap/ui/core/aria/HasPopup" {
	import {aria} from "sap/ui/core/library";

	/**
	 * Types of popups to set as aria-haspopup attribute. Most of the values (except "None") of the enumeration are taken from the ARIA specification: https://www.w3.org/TR/wai-aria/#aria-haspopup
	 *
	 * @public
	 * @since 1.84
	*/
	export default aria.HasPopup;
}

declare module "sap/ui/core/BarColor" {
	import {BarColor} from "sap/ui/core/library";

	/**
	 * Configuration options for the colors of a progress bar.
	 *
	 * @public
	*/
	export default BarColor;
}

declare module "sap/ui/core/BusyIndicatorSize" {
	import {BusyIndicatorSize} from "sap/ui/core/library";

	/**
	 * Configuration options for the <code>BusyIndicator</code> size.
	 *
	 * @public
	*/
	export default BusyIndicatorSize;
}

declare module "sap/ui/core/ComponentLifecycle" {
	import {ComponentLifecycle} from "sap/ui/core/library";

	/**
	 * Enumeration for different lifecycle behaviors of components created by the <code>ComponentContainer</code>.
	 *
	 * @public
	*/
	export default ComponentLifecycle;
}

declare module "sap/ui/core/Design" {
	import {Design} from "sap/ui/core/library";

	/**
	 * Font design for texts.
	 *
	 * @public
	*/
	export default Design;
}

declare module "sap/ui/core/dnd/DropEffect" {
	import {dnd} from "sap/ui/core/library";

	/**
	 * Configuration options for visual drop effects that are given during a drag and drop operation.
	 *
	 * @public
	 * @since 1.52.0
	*/
	export default dnd.DropEffect;
}

declare module "sap/ui/core/dnd/DropLayout" {
	import {dnd} from "sap/ui/core/library";

	/**
	 * Configuration options for the layout of the droppable controls.
	 *
	 * @public
	 * @since 1.52.0
	*/
	export default dnd.DropLayout;
}

declare module "sap/ui/core/dnd/DropPosition" {
	import {dnd} from "sap/ui/core/library";

	/**
	 * Configuration options for drop positions.
	 *
	 * @public
	 * @since 1.52.0
	*/
	export default dnd.DropPosition;
}

declare module "sap/ui/core/dnd/RelativeDropPosition" {
	import {dnd} from "sap/ui/core/library";

	/**
	 * Drop positions relative to a dropped element.
	 *
	 * @public
	 * @since 1.100.0
	*/
	export default dnd.RelativeDropPosition;
}

declare module "sap/ui/core/HorizontalAlign" {
	import {HorizontalAlign} from "sap/ui/core/library";

	/**
	 * Configuration options for horizontal alignments of controls.
	 *
	 * @public
	*/
	export default HorizontalAlign;
}

declare module "sap/ui/core/IconColor" {
	import {IconColor} from "sap/ui/core/library";

	/**
	 * Semantic Colors of an icon.
	 *
	 * @public
	*/
	export default IconColor;
}

declare module "sap/ui/core/ImeMode" {
	import {ImeMode} from "sap/ui/core/library";

	/**
	 * State of the Input Method Editor (IME) for the control.
	 * 
	 * Depending on its value, it allows users to enter and edit for example Chinese characters.
	 *
	 * @public
	*/
	export default ImeMode;
}

declare module "sap/ui/core/IndicationColor" {
	import {IndicationColor} from "sap/ui/core/library";

	/**
	 * Colors to highlight certain UI elements.
	 * 
	 * In contrast to the <code>ValueState</code>, the semantic meaning must be defined by the application.
	 *
	 * @public
	 * @since 1.62.0
	*/
	export default IndicationColor;
}

declare module "sap/ui/core/InvisibleMessageMode" {
	import {InvisibleMessageMode} from "sap/ui/core/library";

	/**
	 * Enumeration for different mode behaviors of the <code>InvisibleMessage</code>.
	 *
	 * @experimental (since 1.73)
	 * @public
	 * @since 1.78
	*/
	export default InvisibleMessageMode;
}

declare module "sap/ui/core/MessageType" {
	import {MessageType} from "sap/ui/core/library";

	/**
	 * Specifies possible message types.
	 *
	 * @deprecated (since 1.120) - Please use {@link sap.ui.core.message.MessageType} instead.
	 * @public
	*/
	export default MessageType;
}

declare module "sap/ui/core/OpenState" {
	import {OpenState} from "sap/ui/core/library";

	/**
	 * Defines the different possible states of an element that can be open or closed and does not only toggle between these states, but also spends some time in between (e.g. because of an animation).
	 *
	 * @public
	*/
	export default OpenState;
}

declare module "sap/ui/core/Orientation" {
	import {Orientation} from "sap/ui/core/library";

	/**
	 * Orientation of a UI element.
	 *
	 * @public
	 * @since 1.22
	*/
	export default Orientation;
}

declare module "sap/ui/core/Priority" {
	import {Priority} from "sap/ui/core/library";

	/**
	 * Priorities for general use.
	 *
	 * @public
	*/
	export default Priority;
}

declare module "sap/ui/core/routing/HistoryDirection" {
	import {routing} from "sap/ui/core/library";

	/**
	 * Enumeration for different HistoryDirections.
	 *
	 * @public
	*/
	export default routing.HistoryDirection;
}

declare module "sap/ui/core/ScrollBarAction" {
	import {ScrollBarAction} from "sap/ui/core/library";

	/**
	 * Actions are: Click on track, button, drag of thumb, or mouse wheel click.
	 *
	 * @public
	*/
	export default ScrollBarAction;
}

declare module "sap/ui/core/Scrolling" {
	import {Scrolling} from "sap/ui/core/library";

	/**
	 * Defines the possible values for horizontal and vertical scrolling behavior.
	 *
	 * @public
	*/
	export default Scrolling;
}

declare module "sap/ui/core/SortOrder" {
	import {SortOrder} from "sap/ui/core/library";

	/**
	 * Sort order of a column.
	 *
	 * @public
	 * @since 1.61.0
	*/
	export default SortOrder;
}

declare module "sap/ui/core/TextAlign" {
	import {TextAlign} from "sap/ui/core/library";

	/**
	 * Configuration options for text alignments.
	 *
	 * @public
	*/
	export default TextAlign;
}

declare module "sap/ui/core/TextDirection" {
	import {TextDirection} from "sap/ui/core/library";

	/**
	 * Configuration options for the direction of texts.
	 *
	 * @public
	*/
	export default TextDirection;
}

declare module "sap/ui/core/TitleLevel" {
	import {TitleLevel} from "sap/ui/core/library";

	/**
	 * Level of a title.
	 *
	 * @public
	 * @since 1.9.1
	*/
	export default TitleLevel;
}

declare module "sap/ui/core/ValueState" {
	import {ValueState} from "sap/ui/core/library";

	/**
	 * Marker for the correctness of the current value.
	 *
	 * @public
	 * @since 1.0
	*/
	export default ValueState;
}

declare module "sap/ui/core/VerticalAlign" {
	import {VerticalAlign} from "sap/ui/core/library";

	/**
	 * Configuration options for vertical alignments, for example of a layout cell content within the borders.
	 *
	 * @public
	*/
	export default VerticalAlign;
}

declare module "sap/ui/core/Wrapping" {
	import {Wrapping} from "sap/ui/core/library";

	/**
	 * Configuration options for text wrapping.
	 *
	 * @public
	*/
	export default Wrapping;
}
