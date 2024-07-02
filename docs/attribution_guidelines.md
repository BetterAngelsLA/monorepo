# Attribution Guidlines

When contributing to this repo, please ensure that any third-party materials are free and open source. Source files, license, attribution, and any other documentation that may be required by the applicable license should be included as described herein. The relative structure for assets, such as [libs/expo/shared/icons/src/assets](./libs/expo/shared/icons/src/assets), should have subdirectories broken down into the creator and the subsequent directories with the associated license.

### Third Party

```
third_party/
├── creator/
│ ├── svg/
│ │ ├── asset1.svg
│ │ ├── asset2.svg
│ │ └── ...
│ ├── LICENSE
│ └── attribution.txt
│ └── other_doc.txt
└── ...
```

### Better Angels

Any materials that are original creations or the product of Better Angels should be placed under the better_angels directory:

```
better_angels/
├── svg/
│ ├── asset1.svg
│ ├── asset2.svg
│ └── ...
└── ...
```

> **Note:** Where reasonable, we would like to have a single instance of each asset rather than duplication to ensure proper handling of assets and references in code.
