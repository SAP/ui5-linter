declare module "sap/ui/generic/app/navigation/service/NavType" {
	import {navigation} from "sap/ui/generic/app/library";

	/**
	 * A static enumeration type which indicates the type of inbound navigation
	 *
	 * @deprecated (since 1.83.0) - Please use {@link sap.fe.navigation.NavType} instead.
	 * @public
	*/
	export default navigation.service.NavType;
}

declare module "sap/ui/generic/app/navigation/service/ParamHandlingMode" {
	import {navigation} from "sap/ui/generic/app/library";

	/**
	 * A static enumeration type which indicates the conflict resolution method when merging URL parameters into select options
	 *
	 * @deprecated (since 1.83.0) - Please use {@link sap.fe.navigation.ParamHandlingMode} instead.
	 * @public
	*/
	export default navigation.service.ParamHandlingMode;
}

declare module "sap/ui/generic/app/navigation/service/SuppressionBehavior" {
	import {navigation} from "sap/ui/generic/app/library";

	/**
	 * A static enumeration type which indicates whether semantic attributes with values <code>null</code>, <code>undefined</code> or <code>""</code> (empty string) shall be suppressed, before they are mixed in to the selection variant in the method {@link sap.ui.generic.app.navigation.service.NavigationHandler.mixAttributesAndSelectionVariant mixAttributesAndSelectionVariant} of the {@link sap.ui.generic.app.navigation.service.NavigationHandler NavigationHandler}
	 *
	 * @deprecated (since 1.83.0) - Please use {@link sap.fe.navigation.SuppressionBehavior} instead.
	 * @public
	*/
	export default navigation.service.SuppressionBehavior;
}
