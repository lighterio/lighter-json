// Reference the native JSON.stringify function in case we change it.
var nativeStringify = JSON.stringify

var self = module.exports = {

  /**
   * Stringify a value while safely detecting circularity.
   *
   * @param  {Any}           value     A value to stringify.
   * @param  {Function}      replacer  An optional replacer function.
   * @param  {Number|String} space     An optional spacer string or number of
   *                                   spaces.
   * @return {String}                  Stringified JSON.
   */
  stringify: function stringify (value, replacer, space) {
    return replacer
      ? nativeStringify(value, replacer, space)
      : safeStringify(value, [], space)
  },

  /**
   * Decorate the JSON object (or a given object) with lighter-json methods.
   *
   * @param  {[type]} json [description]
   * @return {[type]}      [description]
   */
  decorate: function decorate (json) {
    json = json || JSON
    json.scriptify = self.scriptify
    json.nativeStringify = nativeStringify
    json.stringify = self.stringify
  }

}

/**
 * Stringify using a stack of parent values to detect circularity.
 *
 * @param  {Any}           value   A value to stringify.
 * @param  {Array}         stack   An optional stack of parent values.
 * @param  {Number|String} space   An optional spacer string or number of
 *                                 spaces.
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
