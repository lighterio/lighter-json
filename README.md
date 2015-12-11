# lighter-json
[![Chat](https://badges.gitter.im/chat.svg)](//gitter.im/lighterio/public)
[![Version](https://img.shields.io/npm/v/lighter-json.svg)](//www.npmjs.com/package/lighter-json)
[![Downloads](https://img.shields.io/npm/dm/lighter-json.svg)](//www.npmjs.com/package/lighter-json)
[![Build](https://img.shields.io/travis/lighterio/lighter-json.svg)](//travis-ci.org/lighterio/lighter-json)
[![Coverage](https://img.shields.io/coveralls/lighterio/lighter-json/master.svg)](//coveralls.io/r/lighterio/lighter-json)
[![Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](//www.npmjs.com/package/standard)

The `lighter-json` module is a lightweight JavaScript Object Notation utility.

## Quick Start
From your project directory, install and save as a dependency:
```bash
npm install --save lighter-json
```

## API

### JSON.evaluate(js)
Evaluate and return a value from a JavaScript string representation. This
supports non-strict JSON, so a value (or a deep property) can be a Date, a
Function, an Error or a RegExp.

### JSON.globalize()
Decorate the global JSON object with the `lighter-json` package's methods.

### JSON.scriptify(value[, stack])
Convert an object to non-strict JSON, complete with JS code for re-constructing
Date, Error, Function and RegExp values.

### JSON.stringify(value[, replacer[, space]])
Perform a JSON stringify operation on a value, using automatic cycle detection
if a replacer function is not provided.

## More on lighter-json...
* [Contributing](//github.com/lighterio/lighter-json/blob/master/CONTRIBUTING.md)
* [License (ISC)](//github.com/lighterio/lighter-json/blob/master/LICENSE.md)
* [Change Log](//github.com/lighterio/lighter-json/blob/master/CHANGELOG.md)
* [Roadmap](//github.com/lighterio/lighter-json/blob/master/ROADMAP.md)
