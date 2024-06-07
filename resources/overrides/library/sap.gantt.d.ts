declare module "sap/gantt/AdhocLineLayer" {
	import {AdhocLineLayer} from "sap/gantt/library";

	/**
	 * The layer of adhoc line in chart area
	 *
	 * @public
	*/
	export default AdhocLineLayer;
}

declare module "sap/gantt/config/BirdEyeRange" {
	import {config} from "sap/gantt/library";

	/**
	 * Define the range of data that bird eye would use to calculate visibleHorizon
	 *
	 * @public
	*/
	export default config.BirdEyeRange;
}

declare module "sap/gantt/config/FindMode" {
	import {config} from "sap/gantt/library";

	/**
	 * Defines the control where find and select search box will appear
	 *
	 * @public
	*/
	export default config.FindMode;
}

declare module "sap/gantt/config/TimeUnit" {
	import {config} from "sap/gantt/library";

	/**
	 * Different time units used as part of the zoom level. They are names of d3 time unit classes.
	 *
	 * @public
	*/
	export default config.TimeUnit;
}

declare module "sap/gantt/config/ZoomControlType" {
	import {config} from "sap/gantt/library";

	/**
	 * Define the type of zoom control in global tool bar
	 *
	 * @public
	*/
	export default config.ZoomControlType;
}

declare module "sap/gantt/def/filter/ColorMatrixValue" {
	import {def} from "sap/gantt/library";

	/**
	 * Color Matrix Values.
	 * 
	 * The matrix decides what target color from source color.
	 *
	 * @public
	*/
	export default def.filter.ColorMatrixValue;
}

declare module "sap/gantt/def/filter/MorphologyOperator" {
	import {def} from "sap/gantt/library";

	/**
	 * Morphology Operators.
	 * 
	 * The operator decides the morphology to make the shape fatter or slimmer.
	 *
	 * @public
	*/
	export default def.filter.MorphologyOperator;
}

declare module "sap/gantt/DeltaLineLayer" {
	import {DeltaLineLayer} from "sap/gantt/library";

	/**
	 * The layer of delta line in chart area
	 *
	 * @public
	 * @since 1.84
	*/
	export default DeltaLineLayer;
}

declare module "sap/gantt/dragdrop/GhostAlignment" {
	import {dragdrop} from "sap/gantt/library";

	/**
	 * Defines how Gantt Chart aligns a draggable shape to the mouse pointer before dragging.
	 *
	 * @public
	*/
	export default dragdrop.GhostAlignment;
}

declare module "sap/gantt/dragdrop/SnapMode" {
	import {dragdrop} from "sap/gantt/library";

	/**
	 * Defines the side of the shape that gets attached to the nearest visual element.
	 *
	 * @public
	 * @since 1.91
	*/
	export default dragdrop.SnapMode;
}

declare module "sap/gantt/DragOrientation" {
	import {DragOrientation} from "sap/gantt/library";

	/**
	 * Defines how dragged ghost moves when dragging.
	 *
	 * @public
	*/
	export default DragOrientation;
}

declare module "sap/gantt/GenericArray" {
	import {GenericArray} from "sap/gantt/library";

	/**
	 * A hybrid data type that can represent an array of string, or array of object. The result value parsed by this data type are "string[]" or "object[]"
	 * 
	 * Examples of valid values in js: <ol> <li>["order", "activity"]</li> <li>[{name:"order", idName:"OrderNo"},{name:"activity"}]</li> <li>[{name:"order", idName:"OrderNo"},"activity"]</li> </ol>
	 * 
	 * Examples of valid values in xml view: <ol> <li>"order,activity"</li> <li>"[order,activity]"</li> <li>[{"name":"order", "idName":"OrderNo"},{"name":"activity"}]</li> </ol>
	 *
	 * @public
	*/
	export default GenericArray;
}

declare module "sap/gantt/MouseWheelZoomType" {
	import {MouseWheelZoomType} from "sap/gantt/library";

	/**
	 * Different zoom type for mouse wheel zooming
	 *
	 * @public
	*/
	export default MouseWheelZoomType;
}

declare module "sap/gantt/PaletteColor" {
	import {PaletteColor} from "sap/gantt/library";

	/**
	 * Accepts only Gantt palette colors names.
	 *
	 * @public
	 * @since 1.69
	*/
	export default PaletteColor;
}

declare module "sap/gantt/SelectionMode" {
	import {SelectionMode} from "sap/gantt/library";

	/**
	 * Different selection mode for GanttChart
	 *
	 * @public
	*/
	export default SelectionMode;
}

declare module "sap/gantt/shape/ext/rls/RelationshipType" {
	import {shape} from "sap/gantt/library";

	/**
	 * Type of relationships
	 *
	 * @public
	*/
	export default shape.ext.rls.RelationshipType;
}

declare module "sap/gantt/shape/ShapeCategory" {
	import {shape} from "sap/gantt/library";

	/**
	 * Shape Categories.
	 * 
	 * Different categories use different Drawers. Therefore, different categories may have different designs of parameters in their getter methods.
	 *
	 * @public
	*/
	export default shape.ShapeCategory;
}

declare module "sap/gantt/simple/connectorType" {
	import {simple} from "sap/gantt/library";

	/**
	 * Type connector shapes for relationship
	 *
	 * @public
	 * @since 1.86
	*/
	export default simple.connectorType;
}

declare module "sap/gantt/simple/ContainerToolbarPlaceholderType" {
	import {simple} from "sap/gantt/library";

	/**
	 * Toolbar placeholders for a Gantt chart container.
	 *
	 * @public
	*/
	export default simple.ContainerToolbarPlaceholderType;
}

declare module "sap/gantt/simple/findByOperator" {
	import {simple} from "sap/gantt/library";

	/**
	 * Defines the relationship between the operator and the property names using the findAll method
	 *
	 * @public
	 * @since 1.100
	*/
	export default simple.findByOperator;
}

declare module "sap/gantt/simple/GanttChartWithTableDisplayType" {
	import {simple} from "sap/gantt/library";

	/**
	 * Gantt chart display types.
	 *
	 * @public
	*/
	export default simple.GanttChartWithTableDisplayType;
}

declare module "sap/gantt/simple/horizontalTextAlignment" {
	import {simple} from "sap/gantt/library";

	/**
	 * Configuration options for horizontal alignment of title of the shape representing a Task.
	 *
	 * @public
	 * @since 1.81
	*/
	export default simple.horizontalTextAlignment;
}

declare module "sap/gantt/simple/relationshipShapeSize" {
	import {simple} from "sap/gantt/library";

	/**
	 * Size of shapes in the relationship
	 *
	 * @public
	 * @since 1.96
	*/
	export default simple.relationshipShapeSize;
}

declare module "sap/gantt/simple/RelationshipType" {
	import {simple} from "sap/gantt/library";

	/**
	 * Type of relationship shape. <code>sap.gantt.simple.RelationshipType</code> shall be used to define property type on class <code>sap.gantt.simple.Relationship</code>
	 *
	 * @public
	 * @since 1.60.0
	*/
	export default simple.RelationshipType;
}

declare module "sap/gantt/simple/shapes/ShapeAlignment" {
	import {simple} from "sap/gantt/library";

	/**
	 * Configuration options for vertical alignment of shape representing a Task. This is only applicable for Tasks.
	 *
	 * @public
	 * @since 1.81
	*/
	export default simple.shapes.ShapeAlignment;
}

declare module "sap/gantt/simple/shapes/TaskType" {
	import {simple} from "sap/gantt/library";

	/**
	 * Type of task shape.
	 *
	 * @public
	 * @since 1.69
	*/
	export default simple.shapes.TaskType;
}

declare module "sap/gantt/simple/verticalTextAlignment" {
	import {simple} from "sap/gantt/library";

	/**
	 * Configuration options for vertical alignment of title of the shape representing a Task.
	 *
	 * @public
	 * @since 1.81
	*/
	export default simple.verticalTextAlignment;
}

declare module "sap/gantt/simple/VisibleHorizonUpdateSubType" {
	import {simple} from "sap/gantt/library";

	/**
	 * This specifies the sub reason detailing why the visible horizon is changing
	 *
	 * @public
	 * @since 1.100
	*/
	export default simple.VisibleHorizonUpdateSubType;
}

declare module "sap/gantt/simple/VisibleHorizonUpdateType" {
	import {simple} from "sap/gantt/library";

	/**
	 * This type specifies the reason why visible horizon is changing.
	 *
	 * @public
	 * @since 1.68
	*/
	export default simple.VisibleHorizonUpdateType;
}

declare module "sap/gantt/simple/yAxisColumnContent" {
	import {simple} from "sap/gantt/library";

	/**
	 * Configaration option for yAxis Column.
	 *
	 * @public
	 * @since 1.102
	*/
	export default simple.yAxisColumnContent;
}

declare module "sap/gantt/SVGLength" {
	import {SVGLength} from "sap/gantt/library";

	/**
	 * A length is a distance measurement, given as a number along with a unit. If unit is not provided, the length value represents a distance in the current user coordinate system.
	 *
	 * @public
	*/
	export default SVGLength;
}

declare module "sap/gantt/ValueSVGPaintServer" {
	import {ValueSVGPaintServer} from "sap/gantt/library";

	/**
	 * A string type that represents SVG fill color values.
	 * 
	 * Allowed values are {@link sap.ui.core.CSSColor} and {@link sap.m.ValueColor} and LESS parameter The empty string and invalid less parameter fall back to default black color.
	 *
	 * @public
	*/
	export default ValueSVGPaintServer;
}
