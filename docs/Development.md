# UI5 Linter Development

**Note:** This document is intended to support UI5 linter developers and is not relevant for end users of the linter.

## Updating SAPUI5 types

UI5 linter currently comes with a fixed version of the SAPUI5 types that needs to be updated manually.
An update can be performed with following command:
```sh
npm run update-sapui5-types -- <domain> <version>
```

**Note:**
- `domain` is the internal domain (without protocol) that hosts the SAPUI5 SDK API JSON files.
- `version` is the version of the SAPUI5 distribution.

The script updates multiple places where the corresponding SAPUI5 types are referenced or incorporated:
- `@sapui5/types` npm dependency in [package.json](../package.json)
  - This package contains the TypeScript definitions of all SAPUI5 libraries and is relevant for the general TypeScript based detection.
- [`resources/api-extract.json`](../resources/api-extract.json)
  - This file contains additional information that is not available or accessible via the TypeScript definitions. It is an extract from the original `api.json` files of the SAPUI5 libraries.
- [`resources/types/pseudo-modules`](../resources/types/pseudo-modules)
  - This folder contains additional module declarations for the detection of pseudo modules.

## Autofix Checklist

When developing autofix solutions, we realized it's not always a smooth or straightforward process. To mitigate risks such as missed cases or incompatible migrations, we've compiled a checklist of best practices.

Autofix solutions generally fall into two categories:

* **1:1 Replacements**
* **Complex Replacements**

---

### 1:1 Replacements

* [ ] Function arguments have **exactly the same** type, order, value and count.
```js
	// This case should not be migrated to "String#padStart" because the second argument is longer than one char, which will behave differently with the String API
	var padLeft = jQuery.sap.padLeft("a", "Hello", 8);

	var padLeft = jQuery.sap.padLeft("a", "0", 8); // Will be migrated
```
* [ ] Return type of the replacement matches **exactly** the original return type.
* [ ] If the return type is complex (e.g., object or enum):

  * [ ] **Enum**: Contains **exactly the same** values.
  * [ ] **Object**: Has **identical** properties.
  * [ ] **Object methods**: Return values of any method in the returned object must have **the same types** as in the original version.

---

### Complex Replacements

* [ ] If the return type differs, migrate only those cases where it is **not used or assigned** (e.g., setter calls like `sap.ui.getCore().getConfig().setCalendarType(...)`). Use the `isExpectedValueExpression()` utility or the `mustNotUseReturnValue` flag available on some of the standard fix classes.
```js
	// The old API always returns a logger instance, the new one returns undefined. So in case the return value
	// is accessed, the call should not be migrated (i.e. all the cases below):
	jQuery.sap.log.debug().info();
	const debug = (msg, logger) => logger ? logger(msg) : jQuery.sap.log.debug(msg);
	debug("msg 2", jQuery.sap.log.debug("msg 1"));
	debug("msg 2", (jQuery.sap.log.debug("msg 1")));
	debug("msg 2", ((((jQuery.sap.log.debug("msg 1"))))));
	var debugInfo = jQuery.sap.log.debug();
	var info = {
		debug: jQuery.sap.log.debug()
	};
	jQuery.sap.log.debug() ?? jQuery.sap.log.info();
	jQuery.sap.log.debug() ? "a" : "b";
	jQuery.sap.log.debug(), jQuery.sap.log.info();
```
* [ ] Check the legacy API for argument type checks or assertions. If the new solution doesn't handle these internally, ensure to **statically verify** the argument types using the TypeScript TypeChecker. If they don't match with what the new API expects, **skip** the migration or, if easily possible, attempt to convert the type at runtime.
```js

	var padLeft = jQuery.sap.padLeft("a", "0", 4); // Becomes "a".padStart(4, "0");
	var padLeft2 = jQuery.sap.padLeft("a", "0000", 4); // Not migrated. Value differs in old and new
	var padLeft3 = jQuery.sap.padLeft(startsWithLetter, "0", 4); // startsWithLetter might not be possible to be determined
```
* [ ] When arguments are **shuffled, merged, or modified**, ensure any **comments** around them are **preserved**.

* [ ] Maintain **whitespaces and line breaks**. Some expressions span multiple lines or are auto-formatted with tabs/spaces.
```js
	// Line breaks between property access and call
	const myLogger = jQuery.
	sap.
	log.
	getLogger();

	// Spaces between property access, call, and arguments
	jQuery . sap . log . error ( "error" ) ;
```
