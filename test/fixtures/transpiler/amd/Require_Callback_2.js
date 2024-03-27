true && sap.ui.require(["my/module"], (Module) => {
	return Module;
});

true ? sap.ui.require(["my/module"], (Module) => {
	return Module;
}) : "foo";

if (false) {
	return "bar";
} else if (sap.ui.require(["my/module"], (Module) => {
	return Module;
})) {
	return "baz";
}

foo(sap.ui.require(["my/module"], (Module) => {
	return Module;
}), "bar");

if (sap.ui.require(["my/module"], (Module) => {
	return Module;
})) {
	return sap.ui.require(["my/module"], (Module) => {
	return Module;
});
}
const arr = [sap.ui.require(["my/module"], (Module) => {
	return Module;
}), sap.ui.require(["my/module"], (Module) => {
	return Module;
})];
let val = sap.ui.require(["my/module"], (Module) => {
	return Module;
});
let val2 = sap.ui.require(["my/module"], (Module) => {
	return Module;
}) + 1;
let val3 = -sap.ui.require(["my/module"], (Module) => {
	return Module;
});
let val5 = () => sap.ui.require(["my/module"], (Module) => {
	return Module;
});

window.sap.ui.require(["my/module"], (Module) => {
	return Module;
});
window[sap.ui.require(["my/module"], (Module) => {
	return Module;
})];
window["window"].sap.ui.require(["my/module"], (Module) => {
	return Module;
});

window["sap"]["ui"]["require"](["my/module"], (Module) => {
	return Module;
});

let val6 = sap.ui.require(["my/module"], (Module) => {
	return Module;
});
let val7 = sap.ui.require(["my/module"], (Module) => {
	return Module;
}) + 1;
let val8 = () => sap.ui.require(["my/module"], (Module) => {
		return Module;
	});

while(sap.ui.require(["my/module"], (Module) => {
		return Module;
	})) {
	return "foo";
}

do {
	console.log("foo");
} while(sap.ui.require(["my/module"], (Module) => {
		return Module;
	}));

for (let i = 0; i < sap.ui.require(["my/module"], (Module) => {
		return Module;
	}); i++) {
	sap.ui.require(["my/module"], (Module) => {
		return Module;
	})[i]
}

function fn1() {
	sap.ui.require(["my/module"], (Module) => {
		return Module;
	});
}

() => {
	sap.ui.require(["my/module"], (Module) => {
		return Module;
	});
}

(() => sap.ui.require(["my/module"], (Module) => {
	return Module;
}));

const fn2 = function () {
	sap.ui.require(["my/module"], (Module) => {
		return Module;
	});
}

const obj1 = {
	prop1: sap.ui.require(["my/module"], (Module) => {
		return Module;
	}),
	[sap.ui.require(["my/module"], (Module) => {
		return Module;
	})]: "foo"
};

class MyClass {
	prop1 = sap.ui.require(["my/module"], (Module) => {
		return Module;
	});
	[sap.ui.require(["my/module"], (Module) => {
		return Module;
	})] = "foo";
	load() {
		sap.ui.require(["my/module"], (Module) => {
			return Module;
		});
	}
}

function* generatorFunction() {
  yield sap.ui.require(["my/module"], (Module) => {
		return Module;
	});
}

var deps = ["my/module"];
var callback = (MyModule) => {
	console.log(MyModule);
};
sap.ui.require(deps, callback);

var require = function (deps) {
	sap.ui.require(["my/module"], (Module) => {
		return Module;
	});
	sap.ui.require(deps, (Module) => {
		return Module;
	});
}
require(["my/module"]);

var specialRequire = function (param = sap.ui.require(["my/module"], (Module) => {
		return Module;
	})) {
	sap.ui.require(param, (Module) => {
		return Module;
	});
}
