import anyTest, {TestFn} from "ava";
import DocumentRegistryProxy from "../../../../src/linter/ui5Types/DocumentRegistryProxy.js";
import {IScriptSnapshot} from "typescript";

const test = anyTest as TestFn<{
	documentRegistryProxy: DocumentRegistryProxy;
}>;

test.beforeEach((t) => {
	t.context.documentRegistryProxy = new DocumentRegistryProxy();
});

test("DocumentRegistryProxy - acquireDocument (Not implemented)", (t) => {
	t.throws(() =>
		t.context.documentRegistryProxy.acquireDocument("", {},
			undefined as unknown as IScriptSnapshot, "", undefined
		)
	);
});

test("DocumentRegistryProxy - updateDocument (Not implemented)", (t) => {
	t.throws(() =>
		t.context.documentRegistryProxy.updateDocument("", {},
			undefined as unknown as IScriptSnapshot, "", undefined
		)
	);
});

test("DocumentRegistryProxy - releaseDocument (Not implemented)", (t) => {
	t.throws(() =>
		t.context.documentRegistryProxy.releaseDocument("", {})
	);
});

test("DocumentRegistryProxy - reportStats", (t) => {
	t.is(t.context.documentRegistryProxy.reportStats(), "[]");
});
