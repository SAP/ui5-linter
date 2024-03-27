sap.ui.require(["my/module"]);

true && sap.ui.require(["my/module"]);

true ? sap.ui.require(["my/module"]) : "foo";

if (false) {
	return "bar";
} else if (sap.ui.require(["my/module"])) {
	return "baz";
}
foo(sap.ui.require(["my/module"]));

if (sap.ui.require(["my/module"])) {
	return sap.ui.require(["my/module"]);
}
const arr = [sap.ui.require(["my/module"]), sap.ui.require(["my/module"])];
let val = sap.ui.require(["my/module"]);
let val2 = sap.ui.require(["my/module"]) + 1;
let val3 = -sap.ui.require(["my/module"]);
let val5 = () => sap.ui.require(["my/module"]);

window.sap.ui.require(["my/module"]);
window[sap.ui.require(["my/module"])];
window.["sap"].ui.require(["my/module"]);

let val = sap.ui.require(["my/module"]);
let val2 = sap.ui.require(["my/module"]) + 1;
let val3 = () => sap.ui.require(["my/module"]);

new val(sap.ui.require(["my/module"]))(sap.ui.require(["my/module"]));

while(sap.ui.require(["my/module"])) {
	return "foo";
}

do {
	console.log("foo");
} while(sap.ui.require(["my/module"]));

for (let i = 0; i < sap.ui.require(["my/module"]); i++) {
	sap.ui.require(["my/module"])[i]
}

function () {
	sap.ui.require(["my/module"]);
}

() => {
	sap.ui.require(["my/module"]);
}

(() => sap.ui.require(["my/module"]));

var function () {
	sap.ui.require(["my/module"]);
}

const obj1 = {
	prop1: sap.ui.require(["my/module"]),
	[sap.ui.require(["my/module"])]: "foo"
};

class MyClass {
	prop1 = sap.ui.require(["my/module"]);
	[sap.ui.require(["my/module"])]: "foo";
	load() {
		sap.ui.require(["my/module"])
	}
}

function* generatorFunction() {
  yield sap.ui.require(["my/module"]);
}

var deps = ["my/module"];
var callback = (MyModule) => {
	console.log(MyModule);
};
sap.ui.require(deps, callback);

var require = function (deps) {
	sap.ui.require(["my/module"]);
	sap.ui.require(deps);
}
require(["my/module"]);

var specialRequire = function (param = sap.ui.require(["my/module"])) {
	sap.ui.require(param);
}
