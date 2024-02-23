sap.ui.define(function () {
	return function(aFlexObjects, sReference) {
		const oVariantManagementState = oVariantManagementMapDataSelector.get({ reference: sReference });
		const aHiddenVariants = [];
		Object.values(oVariantManagementState).forEach((oVariantManagement) => {
			oVariantManagement.variants.forEach((oVariant) => {
				if (oVariant.visible === false) {
					aHiddenVariants.push(oVariant.key);
				}
			});
		});
		return aFlexObjects.filter((oFilteredFlexObject) => {
			// The following block should produce a coverage message:
			// 	"Unable to analyze this method call because the type of identifier"
			// However, the following line will be transformed to "[...] = ({ [...]" with
			// no source map entry for the added brackets (since it does not exist in source).
			// This poses a challenge for Reporter.ts to map to the correct location in the source file
			const sVariantReference = {
				// eslint-disable-next-line camelcase
				ctrl_variant: () => (oFilteredFlexObject.getVariantId()),
				// eslint-disable-next-line camelcase
				ctrl_variant_change: () => (oFilteredFlexObject.getSelector().id),
				change: () => (oFilteredFlexObject.getVariantReference())
			}[oFilteredFlexObject.getFileType()]?.();
			return !aHiddenVariants.includes(sVariantReference);
		});
	};
});
