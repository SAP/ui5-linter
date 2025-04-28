sap.ui.define([], function() {
	// The global access provides the Core class, while the module import
	// only provides the singleton instance.
	// Therefore this code is not fixable.
	const coreClass = sap.ui.core.Core;

	// Note: In older versions, this used to return the singleton instance,
	// but in newer versions, it throws an error: Cannot instantiate object: "new" is missing!
	// NOTE: For now, we don't fix this case, because it is not a common pattern.
	const core1 = sap.ui.core.Core();

	// Calling the constructor of the Core class always gave back the singleton instance.
	// In this case, the fix must remove the "new" keyword.
	// NOTE: For now, we don't fix this case, because it is not a common pattern.
	const core2 = new sap.ui.core.Core();
});
