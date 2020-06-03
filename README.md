# Node Typescript Module Template

## Overview

Typescript "Hello World" node module template with unit tests. 

## Building

Analyse code for potential errors:
```
npm run lint
```

Fix formating that cause linting errors.
```
npm run lint-fix
```

Run unit tests:
```
npm run test
```

Build project:
```
npm run build
```

## References

The project was setup by creating a skeleton node module project based on instructions found at:

* https://docs.npmjs.com/creating-node-js-modules 

The project was configured for typescript by following the instructions at the following links:

* https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
* https://khalilstemmler.com/blogs/typescript/node-starter-project/

As instructed the following modules were installed.

```
npm install --save-dev typescript
npm install --save-dev @types/node
```

The typescript configuration file `tsconfig.json` was created and customized by running:

```
npx tsc --init --rootDir src --outDir lib \
  --esModuleInterop --resolveJsonModule --lib es6 \
  --module commonjs --allowJs true --noImplicitAny true
```

Linting was setup by following the instructions at the following links:

* https://khalilstemmler.com/blogs/typescript/eslint-for-typescript/
* https://www.robertcooper.me/using-eslint-and-prettier-in-a-typescript-project

As instructed the following modules were installed for linting as well as formatting of typescript code files.

```
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier

npm install --save-dev jest ts-jest @types/jest
```

The file `.eslintrc` was created according to the instructions at the above links to perform the required analysis of the code. The file `prettierrc` was created to ensure the code formatting follows a consisting style.
