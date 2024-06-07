declare module "sap/ui/layout/BackgroundDesign" {
	import {BackgroundDesign} from "sap/ui/layout/library";

	/**
	 * Available Background Design.
	 *
	 * @public
	 * @since 1.36.0
	*/
	export default BackgroundDesign;
}

declare module "sap/ui/layout/BlockBackgroundType" {
	import {BlockBackgroundType} from "sap/ui/layout/library";

	/**
	 * A string type that is used inside the BlockLayout to set predefined background color to the cells inside the control.
	 *
	 * @public
	*/
	export default BlockBackgroundType;
}

declare module "sap/ui/layout/BlockLayoutCellColorSet" {
	import {BlockLayoutCellColorSet} from "sap/ui/layout/library";

	/**
	 * A string type that is used inside the BlockLayoutCell to set a predefined set of colors for the cells.
	 *
	 * @public
	 * @since 1.48
	*/
	export default BlockLayoutCellColorSet;
}

declare module "sap/ui/layout/BlockLayoutCellColorShade" {
	import {BlockLayoutCellColorShade} from "sap/ui/layout/library";

	/**
	 * A string type that is used inside the BlockLayoutCell to set a predefined set of color shades for the cells. The colors are defined with sap.ui.layout.BlockLayoutCellColorSet. And this is for the shades only.
	 *
	 * @public
	 * @since 1.48
	*/
	export default BlockLayoutCellColorShade;
}

declare module "sap/ui/layout/BlockRowColorSets" {
	import {BlockRowColorSets} from "sap/ui/layout/library";

	/**
	 * A string type that is used inside the BlockLayoutRow to set predefined set of colors the cells inside the control. Color sets depend on sap.ui.layout.BlockBackgroundType
	 *
	 * @public
	*/
	export default BlockRowColorSets;
}

declare module "sap/ui/layout/BoxesPerRowConfig" {
	import {BoxesPerRowConfig} from "sap/ui/layout/library";

	/**
	 * A string type that represents how many boxes per row should be displayed for each screen size. The breakpoints are for extra large (XL), large (L), medium (M) and small (S) screen sizes.
	 * 
	 * <b>Note:</b> The parameters must be provided in the order <XL L M S>.
	 *
	 * @public
	 * @since 1.61.0
	*/
	export default BoxesPerRowConfig;
}

declare module "sap/ui/layout/cssgrid/CSSGridAutoFlow" {
	import {cssgrid} from "sap/ui/layout/library";

	/**
	 * A string type that is used for CSS grid to control how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid.
	 *
	 * @public
	 * @since 1.60.0
	*/
	export default cssgrid.CSSGridAutoFlow;
}

declare module "sap/ui/layout/cssgrid/CSSGridGapShortHand" {
	import {cssgrid} from "sap/ui/layout/library";

	/**
	 * A string type that represents a short hand CSS grid gap.
	 *
	 * @public
	 * @since 1.60.0
	*/
	export default cssgrid.CSSGridGapShortHand;
}

declare module "sap/ui/layout/cssgrid/CSSGridLine" {
	import {cssgrid} from "sap/ui/layout/library";

	/**
	 * A string type that represents one or two grid lines. Used to define the position and size of a single grid item.
	 * 
	 * Valid values: <ul> <li>auto</li> <li>inherit</li> <li>1</li> <li>span 2</li> <li>span 2 / 5</li> <li>span 2 / -5</li> <li>5 / 7</li> <li>7 / span 5</li> <li>span 7 / span 5</li> </ul>
	 *
	 * @public
	 * @since 1.60.0
	*/
	export default cssgrid.CSSGridLine;
}

declare module "sap/ui/layout/cssgrid/CSSGridTrack" {
	import {cssgrid} from "sap/ui/layout/library";

	/**
	 * A string type that represents a grid track (the space between two grid lines)
	 *
	 * @public
	 * @since 1.60.0
	*/
	export default cssgrid.CSSGridTrack;
}

declare module "sap/ui/layout/form/ColumnCells" {
	import {form} from "sap/ui/layout/library";

	/**
	 * An <code>int</code> type that defines how many cells a control inside of a column of a <code>Form</code> control using the <code>ColumnLayout</code> control as layout can use.
	 * 
	 * Allowed values are numbers from 1 to 12 and -1. -1 means the value is calculated.
	 *
	 * @public
	 * @since 1.56.0
	*/
	export default form.ColumnCells;
}

declare module "sap/ui/layout/form/ColumnsL" {
	import {form} from "sap/ui/layout/library";

	/**
	 * An <code>int</code> type that defines how many columns a <code>Form</code> control using the <code>ColumnLayout</code> as layout can have if it has large size
	 * 
	 * Allowed values are numbers from 1 to 3.
	 *
	 * @public
	 * @since 1.56.0
	*/
	export default form.ColumnsL;
}

declare module "sap/ui/layout/form/ColumnsM" {
	import {form} from "sap/ui/layout/library";

	/**
	 * An <code>int</code> type that defines how many columns a <code>Form</code> control using the <code>ColumnLayout</code> as layout can have if it has medium size
	 * 
	 * Allowed values are numbers from 1 to 2.
	 *
	 * @public
	 * @since 1.56.0
	*/
	export default form.ColumnsM;
}

declare module "sap/ui/layout/form/ColumnsXL" {
	import {form} from "sap/ui/layout/library";

	/**
	 * An <code>int</code> type that defines how many columns a <code>Form</code> control using the <code>ColumnLayout</code> as layout can have if it has extra-large size
	 * 
	 * Allowed values are numbers from 1 to 6. <b>Note:</b> In versions lower than 1.89 only 4 columns are allowed.
	 *
	 * @public
	 * @since 1.56.0
	*/
	export default form.ColumnsXL;
}

declare module "sap/ui/layout/form/EmptyCells" {
	import {form} from "sap/ui/layout/library";

	/**
	 * An <code>int</code> type that defines how many cells beside the controls inside of a column of a <code>Form</code> control using the <code>ColumnLayout</code> control as layout are empty.
	 * 
	 * Allowed values are numbers from 0 to 11.
	 *
	 * @public
	 * @since 1.56.0
	*/
	export default form.EmptyCells;
}

declare module "sap/ui/layout/form/GridElementCells" {
	import {form} from "sap/ui/layout/library";

	/**
	 * A string that defines the number of used cells in a <code>GridLayout</code>. This can be a number from 1 to 16, "auto" or "full". If set to "auto" the size is determined by the number of fields and the available cells. For labels the auto size is 3 cells. If set to "full" only one field is allowed within the <code>FormElement</code>. It gets the full width of the row and the label is displayed above. <b>Note:</b> For labels full size has no effect.
	 *
	 * @deprecated (since 1.67.0) - as <code>sap.ui.commons</code> library is deprecated and the <code>GridLayout</code> must not be used in responsive applications. Please use <code>ResponsiveGridLayout</code> or <code>ColumnLayout</code> instead.
	 * @public
	*/
	export default form.GridElementCells;
}

declare module "sap/ui/layout/form/SimpleFormLayout" {
	import {form} from "sap/ui/layout/library";

	/**
	 * Available <code>FormLayouts</code> used to render a <code>SimpleForm</code>.
	 *
	 * @public
	 * @since 1.16.0
	*/
	export default form.SimpleFormLayout;
}

declare module "sap/ui/layout/GridIndent" {
	import {GridIndent} from "sap/ui/layout/library";

	/**
	 * A string type that represents the indent values of the <code>Grid</code> for large, medium and small screens.
	 * 
	 * Allowed values are separated by space Letters L, M or S followed by number of columns from 1 to 11 that the container has to take, for example: <code>L2 M4 S6</code>, <code>M11</code>, <code>s10</code> or <code>l4 m4</code>.
	 * 
	 * <b>Note:</b> The parameters must be provided in the order <large medium small>.
	 *
	 * @public
	*/
	export default GridIndent;
}

declare module "sap/ui/layout/GridPosition" {
	import {GridPosition} from "sap/ui/layout/library";

	/**
	 * The position of the {@link sap.ui.layout.Grid}. Can be <code>Left</code> (default), <code>Center</code> or <code>Right</code>.
	 *
	 * @public
	*/
	export default GridPosition;
}

declare module "sap/ui/layout/GridSpan" {
	import {GridSpan} from "sap/ui/layout/library";

	/**
	 * A string type that represents the span values of the <code>Grid</code> for large, medium and small screens.
	 * 
	 * Allowed values are separated by space Letters L, M or S followed by number of columns from 1 to 12 that the container has to take, for example: <code>L2 M4 S6</code>, <code>M12</code>, <code>s10</code> or <code>l4 m4</code>.
	 * 
	 * <b>Note:</b> The parameters must be provided in the order <large medium small>.
	 *
	 * @public
	*/
	export default GridSpan;
}

declare module "sap/ui/layout/SideContentFallDown" {
	import {SideContentFallDown} from "sap/ui/layout/library";

	/**
	 * Types of the DynamicSideContent FallDown options
	 *
	 * @public
	 * @since 1.30
	*/
	export default SideContentFallDown;
}

declare module "sap/ui/layout/SideContentPosition" {
	import {SideContentPosition} from "sap/ui/layout/library";

	/**
	 * The position of the side content - End (default) and Begin.
	 *
	 * @public
	*/
	export default SideContentPosition;
}

declare module "sap/ui/layout/SideContentVisibility" {
	import {SideContentVisibility} from "sap/ui/layout/library";

	/**
	 * Types of the DynamicSideContent Visibility options
	 *
	 * @public
	 * @since 1.30
	*/
	export default SideContentVisibility;
}
