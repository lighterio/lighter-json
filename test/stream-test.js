'use strict'
/* global describe it */
var JSON = require('../lighter-json')
var is = global.is || require('exam-is')
var Readable = require('stream').Readable
var stream = new Readable()
stream.resume = function () {}

describe('JSON.read', function () {
  it('causes a stream to emit objects', function (done) {
    JSON.read(stream).on('object', function (o) {
      is.same(o, {ok: true})
      JSON.unread(stream)
      is(stream._jsonData, undefined)
      done()
    })
    is(stream._jsonData, '')
    stream.emit('data', '{ok:true}\n')
  })

  it('emits errors upon reading invalid JSON', function (done) {
    JSON.read(stream).on('error', function (e) {
      is.error(e)
      JSON.unread(stream)
      done()
    })
    stream.emit('data', 'I am not JSON\n')
  })
})

describe('JSON.write', function () {
  it('writes scriptified values to a stream', function (done) {
    var stream = {
      write: function (data) {
        is(data, '1\n')
        done()
      }
    }
    JSON.write(stream, 1)
  })
})
