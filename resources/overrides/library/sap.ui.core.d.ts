declare module "sap/ui/core/AbsoluteCSSSize" {
	import {AbsoluteCSSSize} from "sap/ui/core/library";

	/**
	 * A string type that represents non-relative CSS size values.
	 * 
	 * This is a subtype of the <code>'&lt;length&gt; type'</code> defined in the CSS specifications. Allowed values are only absolute CSS sizes like &quot;1px&quot; or &quot;2em&quot;. Percentage sizes like &quot;50%&quot; and the special values &quot;auto&quot; and &quot;inherit&quot; are NOT allowed. Mathematical expressions using the CSS3 <code>calc(<i>expression</i>)</code> operator are allowed as long as they do not use percentage sizes.
	 * 
	 * Note that CSS might not allow all these values for every CSS property representing a size. So even if a value is accepted by <code>sap.ui.core.AbsoluteCSSSize</code>, it still might have no effect in a specific context. In other words: UI5 controls usually don't extend the range of allowed values in CSS.
	 * 
	 * <b>Units</b>
	 * 
	 * Valid font-relative units are <code>em, ex</code> and <code>rem</code>. Supported absolute units are <code>cm, mm, in, pc, pt</code> and <code>px</code>. Other units are not supported.
	 * 
	 * <b>Mathematical Expressions</b>
	 * 
	 * Expressions inside the <code>calc()</code> operator are only roughly checked for validity. Not every value that this type accepts is a valid expression in the sense of the CSS spec. But vice versa, any expression that is valid according to the spec should be accepted by this type. The current implementation is based on the {@link http://dev.w3.org/csswg/css-values-3/#calc-syntax CSS3 Draft specification from 22 April 2015}.
	 * 
	 * Noteworthy details: <ul> <li>whitespace is mandatory around a '-' or '+' operator and optional otherwise</li> <li>parentheses are accepted but not checked for being balanced (a restriction of regexp based checks)</li> <li>semantic constraints like type restrictions are not checked</li> </ul>
	 * 
	 * Future versions of UI5 might check <code>calc()</code> expressions in more detail, so applications should not assume that a value, that is invalid according to the CSS spec but currently accepted by this type still will be accepted by future versions of this type.
	 *
	 * @public
	*/
	export default AbsoluteCSSSize;
}

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

declare module "sap/ui/core/Collision" {
	import {Collision} from "sap/ui/core/library";

	/**
	 * Collision behavior: horizontal/vertical.
	 * 
	 * Defines how the position of an element should be adjusted in case it overflows the window in some direction. For both directions this can be "flip", "fit", "flipfit" or "none". If only one behavior is provided it is applied to both directions.
	 * 
	 * Examples: "flip", "fit none", "flipfit fit"
	 *
	 * @public
	*/
	export default Collision;
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

declare module "sap/ui/core/CSSColor" {
	import {CSSColor} from "sap/ui/core/library";

	/**
	 * A string type that represents CSS color values (CSS Color Level 3).
	 * 
	 * <b>Allowed values are:</b> <ul> <li>Hex colors like <code>#666666</code> or <code>#fff</code>,</li> <li>HSL/RGB values with or without transparency, like <code>hsla(90,10%,30%,0.5)</code> or <code>rgb(0,0,0)</code>,</li> <li>CSS color names like <code>darkblue</code>, or special values like <code>inherit</code> and <code>transparent</code>,</li> <li>an empty string, which has the same effect as setting no color.</li> </ul> For more information about the CSS Level 3 color specification, see {@link https://www.w3.org/TR/css-color-3/#css-system}.
	 *
	 * @public
	*/
	export default CSSColor;
}

declare module "sap/ui/core/CSSSize" {
	import {CSSSize} from "sap/ui/core/library";

	/**
	 * A string type that represents CSS size values.
	 * 
	 * The CSS specifications calls this the <code>'&lt;length&gt; type'</code>. Allowed values are CSS sizes like "1px" or "2em" or "50%". The special values <code>auto</code> and <code>inherit</code> are also accepted as well as mathematical expressions using the CSS3 <code>calc(<i>expression</i>)</code> operator. Furthermore, length units representing a percentage of the current viewport dimensions: width (vw), height (vh), the smaller of the two (vmin), or the larger of the two (vmax) can also be defined as a CSS size.
	 * 
	 * Note that CSS does not allow all these values for every CSS property representing a size. E.g. <code>padding-left</code> doesn't allow the value <code>auto</code>. So even if a value is accepted by <code>sap.ui.core.CSSSize</code>, it still might have no effect in a specific context. In other words: UI5 controls usually don't extend the range of allowed values in CSS.
	 * 
	 * <b>Units</b>
	 * 
	 * Valid font-relative units are <code>em, ex</code> and <code>rem</code>. Viewport relative units <code>vw, vh, vmin, vmax</code> are also valid. Supported absolute units are <code>cm, mm, in, pc, pt</code> and <code>px</code>.Other units are not supported yet.
	 * 
	 * <b>Mathematical Expressions</b>
	 * 
	 * Expressions inside the <code>calc()</code> operator are only roughly checked for validity. Not every value that this type accepts might be a valid expression in the sense of the CSS spec. But vice versa, any expression that is valid according to the spec should be accepted by this type. The current implementation is based on the {@link http://dev.w3.org/csswg/css-values-3/#calc-syntax CSS3 Draft specification from 22 April 2015}.
	 * 
	 * Noteworthy details: <ul> <li>whitespace is mandatory around a '-' or '+' operator and optional otherwise</li> <li>parentheses are accepted but not checked for being balanced (a restriction of regexp based checks)</li> <li>semantic constraints like type restrictions are not checked</li> </ul>
	 * 
	 * Future versions of UI5 might check <code>calc()</code> expressions in more detail, so applications should not assume that a value, that is invalid according to the CSS spec but currently accepted by this type still will be accepted by future versions of this type.
	 *
	 * @public
	*/
	export default CSSSize;
}

declare module "sap/ui/core/CSSSizeShortHand" {
	import {CSSSizeShortHand} from "sap/ui/core/library";

	/**
	 * This type checks the short hand form of a margin or padding definition.
	 * 
	 * E.g. "1px 1px" or up to four CSSSize values are allowed or tHe special keyword <code>inherit</code>.
	 *
	 * @public
	 * @since 1.11.0
	*/
	export default CSSSizeShortHand;
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

declare module "sap/ui/core/Dock" {
	import {Dock} from "sap/ui/core/library";

	/**
	 * Docking position: horizontal/vertical.
	 * 
	 * Defines a position on the element which is used for aligned positioning of another element (e.g. the left top corner of a popup is positioned at the left bottom corner of the input field). For the horizontal position possible values are "begin", "left", "center", "right" and "end", where left/right always are left and right, or begin/end which are dependent on the text direction. For the vertical position possible values are "top", "center" and "bottom". Examples: "left top", "end bottom", "center center".
	 *
	 * @public
	*/
	export default Dock;
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

declare module "sap/ui/core/ID" {
	import {ID} from "sap/ui/core/library";

	/**
	 * A string type representing an ID or a name.
	 * 
	 * Allowed is a sequence of characters (capital/lowercase), digits, underscores, dashes, points and/or colons. It may start with a character or underscore only.
	 *
	 * @public
	*/
	export default ID;
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
	 * @deprecated (since 1.120) - Please use {@link module:sap/ui/core/message/MessageType} instead.
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

declare module "sap/ui/core/Percentage" {
	import {Percentage} from "sap/ui/core/library";

	/**
	 * A string type that represents a percentage value.
	 *
	 * @public
	*/
	export default Percentage;
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

declare module "sap/ui/core/URI" {
	import {URI} from "sap/ui/core/library";

	/**
	 * A string type that represents an RFC 3986 conformant URI.
	 *
	 * @public
	*/
	export default URI;
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
