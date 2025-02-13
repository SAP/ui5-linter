declare module "sap/ui/commons/ButtonStyle" {
	import {ButtonStyle} from "sap/ui/commons/library";

	/**
	 * different styles for a button.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'ButtonStyle'.
	 *
	 * @deprecated (since 1.38) - (altogether with sap.ui.commons.Button). Use sap.m.Button with its sap.m.ButtonType instead.
	 * @public
	*/
	export default ButtonStyle;
}

declare module "sap/ui/commons/enums/AreaDesign" {
	import {enums} from "sap/ui/commons/library";

	/**
	 * Value set for the background design of areas
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'enums.AreaDesign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default enums.AreaDesign;
}

declare module "sap/ui/commons/enums/BorderDesign" {
	import {enums} from "sap/ui/commons/library";

	/**
	 * Value set for the border design of areas
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'enums.BorderDesign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default enums.BorderDesign;
}

declare module "sap/ui/commons/enums/Orientation" {
	import {enums} from "sap/ui/commons/library";

	/**
	 * Orientation of a UI element
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'enums.Orientation'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default enums.Orientation;
}

declare module "sap/ui/commons/HorizontalDividerHeight" {
	import {HorizontalDividerHeight} from "sap/ui/commons/library";

	/**
	 * Enumeration of possible HorizontalDivider height settings.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'HorizontalDividerHeight'.
	 *
	 * @deprecated (since 1.38) - without replacement.
	 * @public
	*/
	export default HorizontalDividerHeight;
}

declare module "sap/ui/commons/HorizontalDividerType" {
	import {HorizontalDividerType} from "sap/ui/commons/library";

	/**
	 * Enumeration of possible HorizontalDivider types.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'HorizontalDividerType'.
	 *
	 * @deprecated (since 1.38) - without a replacement.
	 * @public
	*/
	export default HorizontalDividerType;
}

declare module "sap/ui/commons/LabelDesign" {
	import {LabelDesign} from "sap/ui/commons/library";

	/**
	 * Available label display modes.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'LabelDesign'.
	 *
	 * @deprecated (since 1.38) - the concept has been discarded.
	 * @public
	*/
	export default LabelDesign;
}

declare module "sap/ui/commons/layout/BackgroundDesign" {
	import {layout} from "sap/ui/commons/library";

	/**
	 * Background design (i.e. color), e.g. of a layout cell.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'layout.BackgroundDesign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default layout.BackgroundDesign;
}

declare module "sap/ui/commons/layout/BorderLayoutAreaTypes" {
	import {layout} from "sap/ui/commons/library";

	/**
	 * The type (=position) of a BorderLayoutArea
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'layout.BorderLayoutAreaTypes'.
	 *
	 * @deprecated (since 1.38) - (altogether with sap.ui.commons.layout.BorderLayout). Use sap.m.Page instead with its aggregations.
	 * @public
	*/
	export default layout.BorderLayoutAreaTypes;
}

declare module "sap/ui/commons/layout/HAlign" {
	import {layout} from "sap/ui/commons/library";

	/**
	 * Horizontal alignment, e.g. of a layout cell's content within the cell's borders. Note that some values depend on the current locale's writing direction while others do not.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'layout.HAlign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default layout.HAlign;
}

declare module "sap/ui/commons/layout/Padding" {
	import {layout} from "sap/ui/commons/library";

	/**
	 * Padding, e.g. of a layout cell's content within the cell's borders. Note that all options except "None" include a padding of 2px at the top and bottom, and differ only in the presence of a 4px padding towards the beginning or end of a line, in the current locale's writing direction.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'layout.Padding'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default layout.Padding;
}

declare module "sap/ui/commons/layout/Separation" {
	import {layout} from "sap/ui/commons/library";

	/**
	 * Separation, e.g. of a layout cell from its neighbor, via a vertical gutter of defined width, with or without a vertical line in its middle.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'layout.Separation'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default layout.Separation;
}

declare module "sap/ui/commons/layout/VAlign" {
	import {layout} from "sap/ui/commons/library";

	/**
	 * Vertical alignment, e.g. of a layout cell's content within the cell's borders.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'layout.VAlign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default layout.VAlign;
}

declare module "sap/ui/commons/MenuBarDesign" {
	import {MenuBarDesign} from "sap/ui/commons/library";

	/**
	 * Determines the visual design of a MenuBar. The feature might be not supported by all themes.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'MenuBarDesign'.
	 *
	 * @deprecated (since 1.38) - (altogether with sap.ui.commons.Toolbar). Use sap.m.Toolbar and its sap.m.ToolbarDesign instead.
	 * @public
	*/
	export default MenuBarDesign;
}

declare module "sap/ui/commons/MessageType" {
	import {MessageType} from "sap/ui/commons/library";

	/**
	 * [Enter description for MessageType]
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'MessageType'.
	 *
	 * @deprecated (since 1.38) - Instead, use the <code>sap.ui.core.MessageType</code>.
	 * @public
	*/
	export default MessageType;
}

declare module "sap/ui/commons/PaginatorEvent" {
	import {PaginatorEvent} from "sap/ui/commons/library";

	/**
	 * Distinct paginator event types
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'PaginatorEvent'.
	 *
	 * @deprecated (since 1.38) - the concept has been discarded.
	 * @public
	*/
	export default PaginatorEvent;
}

declare module "sap/ui/commons/RatingIndicatorVisualMode" {
	import {RatingIndicatorVisualMode} from "sap/ui/commons/library";

	/**
	 * Possible values for the visualization of float values in the RatingIndicator Control.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'RatingIndicatorVisualMode'.
	 *
	 * @deprecated (since 1.38) - Instead, use <code>sap.m.RatingIndicator</code> control.
	 * @public
	*/
	export default RatingIndicatorVisualMode;
}

declare module "sap/ui/commons/RowRepeaterDesign" {
	import {RowRepeaterDesign} from "sap/ui/commons/library";

	/**
	 * Determines the visual design of a RowRepeater.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'RowRepeaterDesign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default RowRepeaterDesign;
}

declare module "sap/ui/commons/SplitterSize" {
	import {SplitterSize} from "sap/ui/commons/library";

	/**
	 * A string type that represents subset of CSS size values. For the Splitter only px and % are allowed.
	 *
	 * @deprecated (since 1.38) - Instead, use <code>sap.ui.layout.Splitter</code> control.
	 * @public
	*/
	export default SplitterSize;
}

declare module "sap/ui/commons/TextViewColor" {
	import {TextViewColor} from "sap/ui/commons/library";

	/**
	 * Semantic Colors of a text.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'TextViewColor'.
	 *
	 * @deprecated (since 1.38) - the concept has been discarded.
	 * @public
	*/
	export default TextViewColor;
}

declare module "sap/ui/commons/TextViewDesign" {
	import {TextViewDesign} from "sap/ui/commons/library";

	/**
	 * Designs for TextView.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'TextViewDesign'.
	 *
	 * @deprecated (since 1.38) - the concept has been discarded.
	 * @public
	*/
	export default TextViewDesign;
}

declare module "sap/ui/commons/ToolbarDesign" {
	import {ToolbarDesign} from "sap/ui/commons/library";

	/**
	 * Determines the visual design of a Toolbar.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'ToolbarDesign'.
	 *
	 * @deprecated (since 1.38)
	 * @public
	*/
	export default ToolbarDesign;
}

declare module "sap/ui/commons/ToolbarSeparatorDesign" {
	import {ToolbarSeparatorDesign} from "sap/ui/commons/library";

	/**
	 * Design of the Toolbar Separator.
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'ToolbarSeparatorDesign'.
	 *
	 * @deprecated (since 1.38) - (altogether wuith sap.ui.commons.Toolbar). Use sap.m.Toolbar and its sap.m.ToolbarSeparator instead.
	 * @public
	*/
	export default ToolbarSeparatorDesign;
}

declare module "sap/ui/commons/TreeSelectionMode" {
	import {TreeSelectionMode} from "sap/ui/commons/library";

	/**
	 * Selection mode of the tree
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'TreeSelectionMode'.
	 *
	 * @deprecated (since 1.38) - (altogether with sap.ui.commons.Tree). Use sap.m.Tree with its items instead.
	 * @public
	*/
	export default TreeSelectionMode;
}

declare module "sap/ui/commons/TriStateCheckBoxState" {
	import {TriStateCheckBoxState} from "sap/ui/commons/library";

	/**
	 * States for TriStateCheckBox
	 * 
	 * This enum is part of the 'sap/ui/commons/library' module export and must be accessed by the property 'TriStateCheckBoxState'.
	 *
	 * @deprecated (since 1.38) - Use {@link sap.m.CheckBox} and its properties instead.
	 * @public
	 * @since 1.7.2
	*/
	export default TriStateCheckBoxState;
}
