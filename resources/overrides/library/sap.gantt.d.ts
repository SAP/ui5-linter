declare module "sap/gantt/AdhocLineLayer" {
	import AdhocLineLayer from "sap/gantt/library";

	/**
	 * The layer of adhoc line in chart area
	 *
	 * @public
	*/
	export default AdhocLineLayer;
}

declare module "sap/gantt/BirdEyeRange" {
	import BirdEyeRange from "sap/gantt/library";

	/**
	 * Define the range of data that bird eye would use to calculate visibleHorizon
	 *
	 * @public
	*/
	export default BirdEyeRange;
}

declare module "sap/gantt/FindMode" {
	import FindMode from "sap/gantt/library";

	/**
	 * Defines the control where find and select search box will appear
	 *
	 * @public
	*/
	export default FindMode;
}

declare module "sap/gantt/TimeUnit" {
	import TimeUnit from "sap/gantt/library";

	/**
	 * Different time units used as part of the zoom level. They are names of d3 time unit classes.
	 *
	 * @public
	*/
	export default TimeUnit;
}

declare module "sap/gantt/ZoomControlType" {
	import ZoomControlType from "sap/gantt/library";

	/**
	 * Define the type of zoom control in global tool bar
	 *
	 * @public
	*/
	export default ZoomControlType;
}

declare module "sap/gantt/ColorMatrixValue" {
	import ColorMatrixValue from "sap/gantt/library";

	/**
	 * Color Matrix Values.
	 * 
	 * The matrix decides what target color from source color.
	 *
	 * @public
	*/
	export default ColorMatrixValue;
}

declare module "sap/gantt/MorphologyOperator" {
	import MorphologyOperator from "sap/gantt/library";

	/**
	 * Morphology Operators.
	 * 
	 * The operator decides the morphology to make the shape fatter or slimmer.
	 *
	 * @public
	*/
	export default MorphologyOperator;
}

declare module "sap/gantt/DeltaLineLayer" {
	import DeltaLineLayer from "sap/gantt/library";

	/**
	 * The layer of delta line in chart area
	 *
	 * @public
	 * @since 1.84
	*/
	export default DeltaLineLayer;
}

declare module "sap/gantt/GhostAlignment" {
	import GhostAlignment from "sap/gantt/library";

	/**
	 * Defines how Gantt Chart aligns a draggable shape to the mouse pointer before dragging.
	 *
	 * @public
	*/
	export default GhostAlignment;
}

declare module "sap/gantt/SnapMode" {
	import SnapMode from "sap/gantt/library";

	/**
	 * Defines the side of the shape that gets attached to the nearest visual element.
	 *
	 * @public
	 * @since 1.91
	*/
	export default SnapMode;
}

declare module "sap/gantt/DragOrientation" {
	import DragOrientation from "sap/gantt/library";

	/**
	 * Defines how dragged ghost moves when dragging.
	 *
	 * @public
	*/
	export default DragOrientation;
}

declare module "sap/gantt/MouseWheelZoomType" {
	import MouseWheelZoomType from "sap/gantt/library";

	/**
	 * Different zoom type for mouse wheel zooming
	 *
	 * @public
	*/
	export default MouseWheelZoomType;
}

declare module "sap/gantt/SelectionMode" {
	import SelectionMode from "sap/gantt/library";

	/**
	 * Different selection mode for GanttChart
	 *
	 * @public
	*/
	export default SelectionMode;
}

declare module "sap/gantt/RelationshipType" {
	import RelationshipType from "sap/gantt/library";

	/**
	 * Type of relationships
	 *
	 * @public
	*/
	export default RelationshipType;
}

declare module "sap/gantt/ShapeCategory" {
	import ShapeCategory from "sap/gantt/library";

	/**
	 * Shape Categories.
	 * 
	 * Different categories use different Drawers. Therefore, different categories may have different designs of parameters in their getter methods.
	 *
	 * @public
	*/
	export default ShapeCategory;
}

declare module "sap/gantt/connectorType" {
	import connectorType from "sap/gantt/library";

	/**
	 * Type connector shapes for relationship
	 *
	 * @public
	 * @since 1.86
	*/
	export default connectorType;
}

declare module "sap/gantt/ContainerToolbarPlaceholderType" {
	import ContainerToolbarPlaceholderType from "sap/gantt/library";

	/**
	 * Toolbar placeholders for a Gantt chart container.
	 *
	 * @public
	*/
	export default ContainerToolbarPlaceholderType;
}

declare module "sap/gantt/findByOperator" {
	import findByOperator from "sap/gantt/library";

	/**
	 * Defines the relationship between the operator and the property names using the findAll method
	 *
	 * @public
	 * @since 1.100
	*/
	export default findByOperator;
}

declare module "sap/gantt/GanttChartWithTableDisplayType" {
	import GanttChartWithTableDisplayType from "sap/gantt/library";

	/**
	 * Gantt chart display types.
	 *
	 * @public
	*/
	export default GanttChartWithTableDisplayType;
}

declare module "sap/gantt/horizontalTextAlignment" {
	import horizontalTextAlignment from "sap/gantt/library";

	/**
	 * Configuration options for horizontal alignment of title of the shape representing a Task.
	 *
	 * @public
	 * @since 1.81
	*/
	export default horizontalTextAlignment;
}

declare module "sap/gantt/relationshipShapeSize" {
	import relationshipShapeSize from "sap/gantt/library";

	/**
	 * Size of shapes in the relationship
	 *
	 * @public
	 * @since 1.96
	*/
	export default relationshipShapeSize;
}

declare module "sap/gantt/RelationshipType" {
	import RelationshipType from "sap/gantt/library";

	/**
	 * Type of relationship shape. <code>sap.gantt.simple.RelationshipType</code> shall be used to define property type on class <code>sap.gantt.simple.Relationship</code>
	 *
	 * @public
	 * @since 1.60.0
	*/
	export default RelationshipType;
}

declare module "sap/gantt/ShapeAlignment" {
	import ShapeAlignment from "sap/gantt/library";

	/**
	 * Configuration options for vertical alignment of shape representing a Task. This is only applicable for Tasks.
	 *
	 * @public
	 * @since 1.81
	*/
	export default ShapeAlignment;
}

declare module "sap/gantt/TaskType" {
	import TaskType from "sap/gantt/library";

	/**
	 * Type of task shape.
	 *
	 * @public
	 * @since 1.69
	*/
	export default TaskType;
}

declare module "sap/gantt/verticalTextAlignment" {
	import verticalTextAlignment from "sap/gantt/library";

	/**
	 * Configuration options for vertical alignment of title of the shape representing a Task.
	 *
	 * @public
	 * @since 1.81
	*/
	export default verticalTextAlignment;
}

declare module "sap/gantt/VisibleHorizonUpdateSubType" {
	import VisibleHorizonUpdateSubType from "sap/gantt/library";

	/**
	 * This specifies the sub reason detailing why the visible horizon is changing
	 *
	 * @public
	 * @since 1.100
	*/
	export default VisibleHorizonUpdateSubType;
}

declare module "sap/gantt/VisibleHorizonUpdateType" {
	import VisibleHorizonUpdateType from "sap/gantt/library";

	/**
	 * This type specifies the reason why visible horizon is changing.
	 *
	 * @public
	 * @since 1.68
	*/
	export default VisibleHorizonUpdateType;
}

declare module "sap/gantt/yAxisColumnContent" {
	import yAxisColumnContent from "sap/gantt/library";

	/**
	 * Configaration option for yAxis Column.
	 *
	 * @public
	 * @since 1.102
	*/
	export default yAxisColumnContent;
}
