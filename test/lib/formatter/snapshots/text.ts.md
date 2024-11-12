# Snapshot report for `test/lib/formatter/text.ts`

The actual snapshot is saved in `text.ts.snap`.

Generated by [AVA](https://avajs.dev).

## Test Text Formatter (with '--details true')

> Snapshot 1

    `UI5 linter report:␊
    ␊
    <base path>/Test.js␊
      5:1 error Call to deprecated function 'attachInit' of class 'Core'. Details: (since 1.118) - Please use {@link sap.ui.core.Core.ready Core.ready} instead.  no-deprecated-api␊
    ␊
    1 problems (1 errors, 0 warnings)␊
    `

## Test Text Formatter (with '--details false')

> Snapshot 1

    `UI5 linter report:␊
    ␊
    <base path>/Test.js␊
      5:1 error Call to deprecated function 'attachInit' of class 'Core'  no-deprecated-api␊
    ␊
    1 problems (1 errors, 0 warnings)␊
    ␊
    Note: Use "ui5lint --details" to show more information about the findings␊
    `