// Fixture description:
// TypeScript component which inherits from ParentComponent which implements IAsyncContentCreation interface through metadata
import ParentComponent from "mycomp/subdir/ParentComponent";
import * as library from "sap/ui/core/library"; // Unused core library import for code coverage purposes

export default class Component extends ParentComponent {
	static metadata = {
		manifest: 'json'
	};
}
