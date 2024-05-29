// Fixture description:
// TypeScript component which inherits from ParentComponent which implements IAsyncContentCreation interface
import ParentComponent from "mycomp/subdir/ParentComponent";

export default class Component extends ParentComponent {
	static metadata = {
		manifest: "json",
	};
}
