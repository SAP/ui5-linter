const button = new sap.m.Button();
const input = new sap.m.Input();

// This file ensures that thirdparty / non-UI5 bundle files do not cause issues when they are linted.

// The referenced source map contains multiple sections, which refer to different
// sources. This should not lead to issues, especially when referenced sources are
// not part of the project, which can happen when thirdparty bundles are included
// in the project.

//# sourceMappingURL=thirdparty-bundle.js.map
