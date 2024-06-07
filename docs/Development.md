![UI5 logo](./docs/images/UI5_logo_wide.png)

# UI5 linter Development

**Note:** This document is intended to support UI5 Linter developers and is not meant for end users of the linter!

## Metadata generation

The UI5 Linter requires metadata to accurately identify certain issues within the codebase. While the absence of this metadata does not hinder the linter's basic functionality, it may result in incomplete findings.

The extracted and generated metadata is stored within the repository under the `/resources` folder. This metadata plays a crucial role in enhancing the accuracy of the linter's analysis.

Regular updates to the metadata are necessary to ensure that the data is compatible with the corresponding UI5 type definitions.

```sh
npm run update-pseudo-modules-info -- $DOMAIN_NAME/com/sap/ui5/dist/sapui5-sdk-dist/1.120.12/sapui5-sdk-dist-1.120.12-api-jsons.zip 1.120.12
```

```sh
npm run update-semantic-model-info -- $DOMAIN_NAME/com/sap/ui5/dist/sapui5-sdk-dist/1.120.12/sapui5-sdk-dist-1.120.12-api-jsons.zip 1.120.12
```
