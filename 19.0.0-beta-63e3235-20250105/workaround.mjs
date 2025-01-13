import assert from 'node:assert'

import pkg from 'react-compiler-runtime'
const {c} = pkg
assert.strictEqual(typeof c, 'function', 'c should be a function')
