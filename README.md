# Walkthrough
These tests demonstrate ESM and CJS issues with how `react-compiler-runtime` is bundled, since it [moved away from using rollup](https://github.com/facebook/react/pull/31963).

It's necessary to use `node` v20 to run these repros, as v22 and later is far more forgiving when it comes to interop between CSJ and ESM.

The basline is the last version of `react-compiler-runtime` that used rollup, and you should'nt see any errors when running this:
```bash
cd 19.0.0-beta-55955c9-20241229 && npm install && npm test && npm run test:workaround
```

Then there's the first beta build that used `esbuild` and shipped as ESM:
```bash
cd 19.0.0-beta-63e3235-20250105 && npm install
```

Running `node test.cjs` in that folder should yield:
```bash
node test.cjs
//19.0.0-beta-63e3235-20250105/node_modules/react-compiler-runtime/dist/index.js:17
import * as React from "react";
^^^^^^

SyntaxError: Cannot use import statement outside a module
    at wrapSafe (node:internal/modules/cjs/loader:1378:20)
    at Module._compile (node:internal/modules/cjs/loader:1428:41)
    at Module._extensions..js (node:internal/modules/cjs/loader:1548:10)
    at Module.load (node:internal/modules/cjs/loader:1288:32)
    at Module._load (node:internal/modules/cjs/loader:1104:12)
    at Module.require (node:internal/modules/cjs/loader:1311:19)
    at require (node:internal/modules/helpers:179:18)
    at Object.<anonymous> (/Users/cody/Developer/react-rx/repro/19.0.0-beta-63e3235-20250105/test.cjs:3:13)
    at Module._compile (node:internal/modules/cjs/loader:1469:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1548:10)

Node.js v20.18.1
```
Node v20 also fails `node test.mjs` and `node workaround.mjs` as it doesn't see `react-compiler-runtime` as ESM even though it is.
v22 only fails on `node workaround.mjs` as it recognizes `react-compiler-runtime` as valid ESM and that it has named exports, no default export.

These issues is what spawned my PR [that updates `esbuild` to emit with `format: 'esm'`](https://github.com/facebook/react/pull/31993):

```bash
cd 19.0.0-beta-e552027-20250112 && npm i
```
Running `npm test` yields this error:
```bash
> node test.mjs && node test.cjs

/19.0.0-beta-e552027-20250112/test.mjs:3
import {c} from 'react-compiler-runtime'
        ^
SyntaxError: Named export 'c' not found. The requested module 'react-compiler-runtime' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'react-compiler-runtime';
const {c} = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:180:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:263:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:547:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:116:5)
```
This happens on both v22 and v20.
Changing the import accoding to the error message solves it: `npm run test:workaround`.

The reason why node treats `react-compiler-runtime` differently in ESM mode before and after swapping `rollup` with `esbuild` seems to be that `rollup` emits `exports.c = c` while `esbuild` puts all the exports on a `module.exports = {c}`.

[See the diff.](https://npmdiff.dev/react-compiler-runtime/19.0.0-beta-55955c9-20241229/19.0.0-beta-e552027-20250112/package/dist/index.js/)

# Suggested solution

The most elegant fix would be that `babel-eslint-react-compiler` starts emitting:
```ts
import pkg from 'react-compiler-runtime'
const {c: _c} = pkg
```
instead of the current
```ts
import {c as _c} from 'react-compiler-runtime'
```
as it works both with ESM and CJS, as demonstrated by the `workaround.mjs` tests.

Alternatively the bundling of `react-compiler-runtime` can be refactored to emit syntax using `exports.c = c`, as it did when it was using rollup. Instead of the way `esbuild` currently does a `module.exports = {c}`