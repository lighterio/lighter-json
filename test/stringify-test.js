'use strict'
/* global describe it before after */
var JSON = require('../lighter-json')
var is = global.is || require('exam/lib/is')

var nativeStringify = JSON.stringify

describe('JSON.stringify', function () {
  before(function () {
    require('../common/json/stringify')
  })

  after(function () {
    delete JSON.nativeStringify
    JSON.stringify = nativeStringify
  })

  describe('matches the native method', function () {
    it('for undefined', function () {
      match(undefined)
    })

    it('for null', function () {
      match(null)
    })

    it('for booleans', function () {
      match(true)
      match(false)
    })

    it('for numbers', function () {
      match(1)
      match(0)
      match(1.1)
      match(-1)
      match(1e6)
      match(1e99)
      match(Infinity)
      match(NaN)
    })

    it('for strings', function () {
      match('hi')
      match('"hi"')
      match('\t"hi"\n')
      match('hi\r\n')
      match('hi\\you')
      match('"hi\\you\\"')
    })

    it('for functions', function () {
      match(function () {})
      match(match)
      match(JSON.nativeStringify)
    })

    it('for objects', function () {
      match({'0': 1, a: 2, '*': 3})
      match({a: 1, f: function () {}, b: 2})
      match({u: undefined})
    })

    it('for arrays', function () {
      match([1, 2, 3])
    })
  })

  describe('is circular-safe', function () {
    it('for one level with an object', function () {
      var o = {}
      o.o = o
      is(JSON.stringify(o), '{"o":"[Circular 1]"}')
    })

    it('for 2 levels with an array', function () {
      var o = {}
      o.a = [o]
      is(JSON.stringify(o), '{"a":["[Circular 2]"]}')
    })
  })
})

function match (value) {
  var expected = JSON.nativeStringify(value)
  var actual = JSON.stringify(value)
  is(actual, expected)
}
