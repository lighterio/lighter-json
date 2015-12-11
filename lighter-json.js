'use strict'
var vm = require('vm')
var context = {}

var base = '\u001b[39m'
var red = '\u001b[31m'
var green = '\u001b[32m'
var yellow = '\u001b[33m'
var magenta = '\u001b[35m'
var cyan = '\u001b[36m'
var gray = '\u001b[90m'

// Reference the native JSON.stringify function in case we change it.
var nativeStringify = JSON.nativeStringify || JSON.stringify

/**
 * Decorate the global JSON object with `lighter-json` methods.
 */
exports.globalize = function globalize () {
  JSON.evaluate = evaluate
  JSON.nativeStringify = JSON.nativeStringify || nativeStringify
  JSON.read = read
  JSON.scriptify = scriptify
  JSON.stringify = stringify
  return exports
}

/**
 * Turn colors off in JSON.colorize output.
 */
exports.uncolor = function uncolor () {
  base = ''
  red = ''
  green = ''
  yellow = ''
  magenta = ''
  cyan = ''
  gray = ''
  return exports
}

/**
 * Stringify a value while safely detecting circularity.
 *
 * @param  {Any}           value     A value to stringify.
 * @param  {Function}      replacer  An optional replacer function.
 * @param  {Number|String} space     Optional whitespace or number of spaces.
 * @return {String}                  Stringified JSON.
 */
var stringify = exports.stringify = function stringify (value, replacer, space) {
  return replacer
    ? nativeStringify(value, replacer, space)
    : safeStringify(value, [], space)
}

/**
 * Evaluate a piece of JavaScript code.
 *
 * @param  {String} js  A snippet of JavaScript code.
 * @return {Any}        The value of that snippet.
 */
var evaluate = exports.evaluate = function evaluate (js) {
  try {
    vm.runInNewContext('var o = ' + js, context)
    return context.o
  } catch (e) {
    e.message += '\n' + js + '\n' + (e instanceof SyntaxError)
    throw e
  }
}

/**
 * Listen to a readable stream that's not in object mode, and interpret its
 * lines as objects.
 *
 * @param  {Object} stream  A readable stream.
 * @return {Object}         The stream.
 */
var read = exports.read = function read (stream) {
  var data = ''
  stream.on('data', function (chunk) {
    data += chunk
    var end = data.indexOf('\n')
    while (end > 0) {
      var line = data.substr(0, end)
      data = data.substr(end + 1)
      var value = evaluate(line)
      var error = evaluate.error
      if (error) {
        stream.emit('error', error)
      } else {
        stream.emit(typeof value, value)
      }
      end = data.indexOf('\n')
    }
  })
  return stream
}

/**
 * Convert an object to non-strict JSON, complete with JS code for
 * re-constructing Date, Error, Function and RegExp values.
 *
 * The JSON.scriptify method also has options, attached as properties:
 * - scriptify.ownPropertiesOnly: false
 * - scriptify.maxDepth: 5
 *
 * @param  {Any}    value    A value to stringify.
 * @param  {Object} options  Optional options:
 *                             * ownOnly: Whether to only show an object's
 *                                own properties, thereby omitting properties
 *                                that were inherited from its prototype.
 *                             * maxDepth: Maximum property depth. (default: 5)
 * @return {String}          Stringified JavaScript.
 */
var scriptify = exports.scriptify = function (value, options) {
  var type = (typeof value)
  if (type === 'function') {
    return value.toString()
  }
  if (type === 'string') {
    return nativeStringify(value)
  }
  if (type === 'object' && value) {
    if (value instanceof Date) {
      return 'new Date(' + value.getTime() + ')'
    }
    if (value instanceof Error) {
      return '(function(){var e=new Error(' + scriptify(value.message) + ');' +
        'e.stack=' + scriptify(value.stack) + ';return e})()'
    }
    if (value instanceof RegExp) {
      return '/' + value.source + '/' + (value.global ? 'g' : '') + (value.ignoreCase ? 'i' : '') + (value.multiline ? 'm' : '')
    }
    var maxDepth = options.maxDepth || scriptify.maxDepth
    var ownOnly = options.ownOnly || scriptify.ownOnly
    var stack = options._stack = options._stack || []
    var i, length
    if (stack) {
      length = stack.length
      for (i = 0; i < length; i++) {
        if (stack[i] === value) {
          return '{"^":' + (length - i) + '}'
        }
      }
    }
    stack = stack || []
    stack.push(value)
    var string
    if (stack.length > maxDepth) {
      value = (value instanceof Array) ? '"[Array]"' : '"[Object]"'
    } else if (value instanceof Array) {
      string = '['
      length = value.length
      for (i = 0; i < length; i++) {
        string += (i ? ',' : '') + scriptify(value[i], options)
      }
      stack.pop()
      return string + ']'
    } else {
      i = 0
      string = '{'
      for (var key in value) {
        if (!ownOnly || value.hasOwnProperty(key)) {
          string += (i ? ',' : '') + (/^[$_a-z][\w$]*$/i.test(key) ? key : '"' + key + '"') + ':' + scriptify(value[key], options)
          i++
        }
      }
      stack.pop()
      return string + '}'
    }
  }
  return '' + value
}
scriptify.maxDepth = 5
scriptify.ownOnly = false

/**
 * Create colorized JSON for terminals.
 *
 * @param  {Any}    value    A value to stringify.
 * @param  {Object} options  Optional options:
 *                             * ownOnly: Whether to only show an object's
 *                                own properties, thereby omitting properties
 *                                that were inherited from its prototype.
 *                             * maxWidth: Maximum output width. (default: 80)
 *                             * maxDepth: Maximum property depth. (default: 5)
 *                             * space: String of whitespace, or number of
 *                                spaces. (default: '  ')
 *                             * indent: Maximum property depth. (default: 5)
 */
var colorize = exports.colorize = function (value, options) {
  var ownOnly = options.ownOnly || colorize.ownOnly
  var space = options.space || colorize.space
  var indent = options.indent || colorize.indent
  var maxWidth = options.maxWidth || colorize.maxWidth
  var maxDepth = options.maxDepth || colorize.maxDepth
  var stack = options._stack

  var type = typeof value
  var color
  if (type === 'function') {
    value = value.toString()
    if (stack) {
      value = value.replace(/\s+/g, ' ')
      if (value.length > maxWidth) {
        value = value.replace(/^([^\{]+?)\{.*\}$/, '$1{...}')
      }
      color = cyan
    }
  } else if ((type === 'object') && value) {
    if (value instanceof Date) {
      value = value.toUTCString()
      if (stack) {
        value = '[Date: ' + value + ']'
        color = cyan
      }
    } else if (value instanceof Error) {
      var e = value
      var message = (e.stack || '' + e).replace(/^\w*Error:? ?/, '')
      if (stack) {
        value = '[' + (e.name || 'Error') + ': ' + message + ']'
      } else {
        value = e.stack || '' + e
      }
      color = cyan
    } else if (value instanceof RegExp) {
      value = '/' + value.source + '/' +
        (value.global ? 'g' : '') +
        (value.ignoreCase ? 'i' : '') +
        (value.multiline ? 'm' : '')
      color = green
    } else {
      stack = options._stack = options._stack || []
      var colon = gray + (space ? ': ' : ':')
      for (var i = 0, l = stack.length; i < l; i++) {
        if (stack[i] === value) {
          return gray + '[Circular ^' + (l - i) + ']' + base
        }
      }
      stack.push(value)
      var parts = []
      var length = 0
      var text
      var isArray = (value instanceof Array)
      if (stack.length > maxDepth) {
        value = cyan + (isArray ? '[Array]' : '[Object]') + base
      } else {
        options.indent += space
        options.maxWidth -= space.length
        if (isArray) {
          value.forEach(function (prop) {
            text = JSON.colorize(prop, options)
            length += text.replace().length
            parts.push(text)
          })
        } else {
          for (var key in value) {
            if (!ownOnly || value.hasOwnProperty(key)) {
              var prop = value[key]
              key = nativeStringify(key)
              if (key[1] === '_') {
                key = gray + key
              }
              text = key + colon + JSON.colorize(prop, options)
              length += text.plain.length
              parts.push(text)
            }
          }
        }
        options.indent = indent
        options.maxWidth = maxWidth
        if (space) {
          if (parts.length) {
            length += (parts.length - 1) * 2
          }
          if (length + indent.length > maxWidth) {
            value = '\n' + indent + parts.join(gray + ',\n' + indent) + '\n' + indent.substr(2)
          } else {
            value = parts.join(gray + ', ')
          }
        } else {
          value = parts.join(gray + ',')
        }
        if (isArray) {
          value = gray + '[' + value + gray + ']'
        } else {
          value = gray + '{' + value + gray + '}'
        }
      }
      stack.pop()
    }
  } else if (stack && !color) {
    if (type === 'string') {
      value = nativeStringify(value)
      color = green
    } else if (type === 'number') {
      color = magenta
    } else if (type === 'boolean') {
      color = yellow
    } else {
      color = red
    }
  }
  return color ? color + value + base : value
}
colorize.maxWidth = 80
colorize.maxDepth = 5
colorize.maxSize = 1e3

/**
 * Stringify using a stack of parent values to detect circularity.
 *
 * @param  {Any}           value   A value to stringify.
 * @param  {Array}         stack   An optional stack of parent values.
 * @param  {Number|String} space   Optional whitespace or number of spaces.
 * @return {String}                Stringified JSON.
 */
function safeStringify (value, stack, space) {
  if (value === null) {
    return 'null'
  }
  if (typeof value !== 'object') {
    return nativeStringify(value)
  }
  var length = stack.length
  for (var i = 0; i < length; i++) {
    if (stack[i] === value) {
      return '"[Circular ' + (length - i) + ']"'
    }
  }
  stack.push(value)
  var isArray = (value instanceof Array)
  var list = []
  var json
  if (isArray) {
    length = value.length
    for (i = 0; i < length; i++) {
      json = safeStringify(value[i], stack, space)
      if (json !== undefined) {
        list.push(json)
      }
    }
  } else {
    for (var key in value) {
      json = safeStringify(value[key], stack, space)
      if (json !== undefined) {
        key = nativeStringify(key) + ':' + (space ? ' ' : '')
        list.push(key + json)
      }
    }
  }
  if (space && list.length) {
    var indent = '\n' + (new Array(stack.length)).join(space)
    var indentSpace = indent + space
    list = indentSpace + list.join(',' + indentSpace) + indent
  } else {
    list = list.join(',')
  }
  value = isArray ? '[' + list + ']' : '{' + list + '}'
  stack.pop()
  return value
}
