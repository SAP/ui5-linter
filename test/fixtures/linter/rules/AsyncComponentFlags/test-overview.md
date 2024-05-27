## Test Variants

### IAsyncContentCreation Interface

Implemented either directly by the Component, by the Parent Component or not at all.

Can be implemented by defining the string `sap.ui.core.IAsyncContentCreation` in the "interface" array of the component metadata,
or by using the IAsyncContentCreation property of the `sap/ui/core/library` module. The latter is discouraged as it does not work
in TypeScript (see also https://github.com/SAP/openui5/issues/3895), hence it is currently not detected.

In case of TypeScript files, it can also be define using the `implements` keyword.

### Async Manifest Flags

There are two relevant flags in the component manifest. The manifest can either be a separate `manifest.json` file or defined inline in the component metadata.

The first flag is `"sap.ui5".rootView.async`, which is only evaluated if `"sap.ui5".rootView` is defined. If this configuration object is not provided on a Component, a parent's 

The second flag is `"sap.ui5".routing.config.async`, which is only evaluated if `"sap.ui5".routing` is defined.

