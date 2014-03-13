## Beyo

Beyo Application framework built on top of koa and other goodies.

## Features

* Asynchronous API through generator functions [`co`](https://github.com/visionmedia/co) compatible.
* Modular application design using a simple HMVC pattern
* Unobstructive implementation, just the project structure guideline

## Project structure

A Beyo application project have this structure.

```
- ./project-root
  +- app
  |  +- modules
  |  |  +- controllers
  |  |  +- models
  |  |  |  +- mappers
  |  |  |  +-
  |  |  +- services
  |  |  +- views
  |  +- index.js
  +- conf
     +- index.json
  +- layouts
  |  +- index.jade
  +- pub
     +- css
     +- js
     +- img
```

## Application Configuration

*TODO*

## Application Modules

*TODO*

### Controllers

*TODO*

### Models

*TODO*

#### Mappers

*TODO*

### Views

*TODO*

## Contribution

All contributions welcome! Every PR **must** be accompanied by their associated
unit tests!

## License

The MIT License (MIT)

Copyright (c) 2014 Mind2Soft <yanick.rochon@mind2soft.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
