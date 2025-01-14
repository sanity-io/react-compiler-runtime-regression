const assert = require('node:assert')

const { c: _c } = require('react/compiler-runtime')
assert.strictEqual(typeof _c, 'function', '_c should be a function')
