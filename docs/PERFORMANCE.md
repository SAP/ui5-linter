# Benchmark Projects

For all benchmarks below, execute `ui5lint` without any parameters. Benchmarks created based on [Benchmarking UI5 Tooling](https://sap.github.io/ui5-tooling/stable/pages/Benchmarking/):

```sh
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ./bench.md
```

## Small app: `openui5-sample-app`

_Reference commit: [`c9a0f7c51`](https://github.com/SAP/openui5-sample-app/tree/c9a0f7c51)_

**Metadata:**

* Resources to lint: `17` (31.59 KB)
* Latest Result: `0 problems (0 errors, 0 warnings)`

## Non-JS library with no findings: OpenUI5 `themelib_sap_horizon`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/themelib_sap_horizon) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `0`
* Latest Result: `0 problems (0 errors, 0 warnings)`

## Small library: OpenUI5 `sap.ui.testrecorder`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.ui.testrecorder) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `68` (0.19 MB)
* Latest Result: `13 problems (13 errors, 0 warnings)`

## Medium library: OpenUI5 `sap.ui.layout`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.ui.layout) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `572` (2.4 MB)
* Latest Result: `1140 problems (1140 errors, 0 warnings)`

## Large library: OpenUI5 `sap.m`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.m) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `5609` (25.67 MB)
* Latest Result: `11293 problems (11293 errors, 0 warnings)`


## Large library: OpenUI5 `sap.ui.core`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.ui.core) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `4950` (45 MB)
* Latest Result: `4816 problems (4816 errors, 0 warnings)` + `2 fatal errors`

# Benchmark Runs

## April 17, 2024

* UI5 linter [`33d8cc5`](https://github.com/SAP/ui5-linter/commit/33d8cc5)
* Node.js `v20.11.1`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 595.7 ± 22.8 | 545.1 | 630.6 |

### openui5-sample-app

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 2.242 ± 0.043 | 2.182 | 2.322 |

### sap.ui.testrecorder

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 3.605 ± 0.071 | 3.520 | 3.768 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 5.995 ± 0.045 | 5.934 | 6.086 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 38.769 ± 0.508 | 38.096 | 39.585 |

### sap.ui.core

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 53.864 ± 2.036 | 50.265 | 56.210 |

## March 11, 2024

* UI5 linter [`5466be5`](https://github.com/SAP/ui5-linter/commit/5466be5b983c4c6e6108c0d97d5221b8ad320a88)
* Node.js `v20.11.1`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 442.6 ± 33.8 | 409.4 | 529.5 |

### openui5-sample-app

**Based on [`fa6d40d`](https://github.com/SAP/openui5-sample-app/tree/fa6d40d2a3ef7c7bb7c416117a0efc675ec90c65), which still contained linting errors**

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
2.171 ± 0.072 | 2.076 | 2.315 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
6.002 ± 0.064 | 5.936 | 6.127 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 34.470 ± 0.421 | 34.178 | 35.585 |


# Helper Scripts

```sh
# <Inside the openui5 repository root>
cd src/themelib_sap_horizon
ui5lint
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ../../bench-themelib_sap_horizon.md

cd ../sap.ui.testrecorder
ui5lint
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ../../bench-sap.ui.testrecorder.md

cd ../sap.ui.layout
ui5lint
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ../../bench-sap.ui.layout.md

cd ../sap.m
ui5lint
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ../../bench-sap.m.md

cd ../sap.ui.core
ui5lint
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ../../bench-sap.ui.core.md
```

```sh
# <Inside the openui5-sample-app root>

ui5lint
hyperfine -i --warmup 1 \
'node $(which ui5lint)' \
--export-markdown ./bench.md
```

Helper script to determine the count and accumulated size of all files to be linted:

```js
// For a one-time evaluation, place this for example at the beginning of the lintWorkspace function
// *DO NOT USE THIS WHILE TAKING BENCHMARK MEASUREMENTS*
const allResources = await workspace.byGlob("**/{*.js,*.js.map,*.ts,*.html,manifest.json,manifest.appdescr_variant,*.view.xml,*.fragment.xml,ui5.yaml,*-ui5.yaml,*.ui5.yaml,ui5-*.yaml}")
const sizeOfAllFiles = await allResources.reduce(async (acc, res) => {
	const currentLength = await acc
	const str = await res.getBuffer();
	return currentLength + str.length;
}, Promise.resolve(0))
console.log(`Total count of all files to be linted: ${allResources.length}`);
console.log(`Total size of all files: ${sizeOfAllFiles} bytes`);
````
