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

* [ ] Function arguments have **exactly the same** type, order, and count.
* [ ] Return type of the replacement matches **exactly** the original return type.
* [ ] If the return type is complex (e.g., object or enum):

  * [ ] **Enum**: Contains **exactly the same** values.
  * [ ] **Object**: Has **identical** properties.
  * [ ] **Object methods**: Return values of any method in the returned object must have **the same types** as in the original version.

---

### Complex Replacements

* [ ] If the return type differs, use the `isExpectedValueExpression()` utility and the `fixHints.exportCodeToBeUsed.isExpectedValue` flag. Migrate only when the result is **not used or assigned** further (e.g., setter calls like `sap.ui.getCore().getConfig().setCalendarType(...)`).
* [ ] In legacy code, argument type checks or assertions are common. If the new solution doesn't handle these internally, ensure you can **statically verify** the argument types. If not, **skip** the migration.
* [ ] When arguments are **shuffled, merged, or modified**, ensure any **comments** around them are **preserved**.
* [ ] Maintain **whitespaces and line breaks**. Some expressions span multiple lines or are auto-formatted with tabs/spaces.
