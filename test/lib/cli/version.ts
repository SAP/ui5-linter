import test from "ava";
import {setVersionInfo, getFormattedVersion, getVersion} from "../../../src/cli/version.js";

test("Set and get version", (t) => {
	const sampleVersion = "1.2.3";
	const sampleVersion2 = "4.5.6-foo.bar";
	const samplePath = "/path/to/cli.js";

	t.is(getFormattedVersion(), "");
	t.is(getVersion(), "");

	setVersionInfo(sampleVersion, samplePath);
	t.is(getFormattedVersion(), `${sampleVersion} (from ${samplePath})`);
	t.is(getVersion(), sampleVersion);

	setVersionInfo(sampleVersion2, samplePath);
	t.is(getFormattedVersion(), `${sampleVersion2} (from ${samplePath})`);
	t.is(getVersion(), sampleVersion2);
});
