import assert from 'node:assert'

import c from 'react-compiler-runtime'
const { c: _c } = c
assert.strictEqual(typeof _c, 'function', '_c should be a function')
