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
* Latest Result: `33 problems (26 errors, 7 warnings)`

## Medium library: OpenUI5 `sap.ui.layout`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.ui.layout) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `572` (2.4 MB)
* Latest Result: `1421 problems (1333 errors, 88 warnings)`

## Large library: OpenUI5 `sap.m`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.m) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `5609` (25.67 MB)
* Latest Result: `13516 problems (12335 errors, 1181 warnings)`

## Large library: OpenUI5 `sap.ui.core`

_Reference commit: [`0efb2cd`](https://github.com/SAP/openui5/tree/0efb2cd89a893b499f40c43c7534240524c5de42/src/sap.ui.core) (tag `1.120.10`)_

**Metadata:**

* Resources to lint: `4950` (45 MB)
* Latest Result: `6141 problems (5520 errors, 621 warnings)` + `2 fatal errors`

# Benchmark Runs

## September 30, 2024

* UI5 linter [`v1.0.0`](https://github.com/SAP/ui5-linter/commit/db5ad3302d62b3a168f92a82d55a3fa56c753d4f)
* Node.js `v22.5.1`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 569.5 ± 9.9 | 555.5 | 586.4 |

### openui5-sample-app

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 2.027 ± 0.038 | 2.002 | 2.128 |

### sap.ui.testrecorder

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 3.250 ± 0.069 | 3.174 | 3.389 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 5.006 ± 0.133 | 4.854 | 5.348 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 32.300 ± 0.369 | 31.891 | 32.942|

### sap.ui.core

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 38.002 ± 0.690 | 37.093 | 38.696 |

## September 05, 2024

* UI5 linter [`v0.3.5`](https://github.com/SAP/ui5-linter/commit/4cdb94b1be12595d34f56b12e3e33e8a6d383d86)
* Node.js `v22.5.1`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 546.5 ± 12.8 | 523.8 | 560.8 |

### openui5-sample-app

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 2.057 ± 0.033 | 2.010 | 2.100 |

### sap.ui.testrecorder

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 3.309 ± 0.026 | 3.283 | 3.351 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 5.177 ± 0.092 | 5.093 | 5.426 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 32.673 ± 0.886 | 31.707 | 34.514 |

### sap.ui.core

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 38.925 ± 0.649 | 38.206 | 39.781 |

## August 21, 2024

* UI5 linter [`v0.3.3`](https://github.com/SAP/ui5-linter/commit/eda26b5eb271fb3cfce711958024ee9176cbbc49)
* Node.js `v22.5.1`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 574.7 ± 53.3 | 505.9 | 687.8 |

### openui5-sample-app

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 2.194 ± 0.105 | 2.103 | 2.394 |

### sap.ui.testrecorder

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 3.361 ± 0.036 | 3.291 | 3.428 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 4.961 ± 0.075 | 4.896 | 5.164 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 30.899 ± 0.159 | 30.701 | 31.158 |

### sap.ui.core

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 38.262 ± 0.600 | 37.360 | 39.224 |

## August 21, 2024

* UI5 linter [`v0.3.2`](https://github.com/SAP/ui5-linter/commit/5d7de1dadc6da7f21a2ffb9d20e117b924cbe317)
* Node.js `v22.5.1`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 593.9 ± 41.2 | 523.2 | 654.9 |

### openui5-sample-app

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 2.144 ± 0.042 | 2.097 | 2.214 |

### sap.ui.testrecorder

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 3.289 ± 0.081 | 3.215 | 3.424 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 5.043 ± 0.077 | 4.959 | 5.169 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 31.440 ± 0.279 | 30.883 | 31.833 |

### sap.ui.core

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 40.402 ± 1.115 | 38.796 | 42.786 |


## June 27, 2024

* UI5 linter [`b34d7e9`](https://github.com/SAP/ui5-linter/commit/b34d7e9)
* Node.js `v22.1.0`
* MacBook Pro M1 Max

### themelib_sap_horizon

| Mean [ms] | Min [ms] | Max [ms] |
|---:|---:|---:|
| 595.9 ± 26.9 | 541.2 | 633.9 |

### openui5-sample-app

Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 2.078 ± 0.028 | 2.045 | 2.132 |

### sap.ui.testrecorder

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 3.591 ± 0.099 | 3.456 | 3.763 |

### sap.ui.layout

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 5.361 ± 0.070 | 5.257 | 5.467 |

### sap.m

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 32.459 ± 0.708 | 31.648 | 33.928 |

### sap.ui.core

| Mean [s] | Min [s] | Max [s] |
|---:|---:|---:|
| 39.528 ± 1.298 | 37.209 | 41.396 |

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
git checkout 0efb2cd

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

cd ../..
```

```sh
# <Inside the openui5-sample-app root>
git checkout c9a0f7c51

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
