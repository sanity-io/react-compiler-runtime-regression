const assert = require('node:assert')

const {c} = require('react-compiler-runtime')
assert.strictEqual(typeof c, 'function', 'c should be a function')
