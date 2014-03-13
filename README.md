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
  |  |  +- conf
  |  |  +- controllers
  |  |  +- models
  |  |  +- services
  |  |  +- views
  |  +- index.js
  +- conf
  |  +- index.json
  +- layouts
  |  +- index.jade
  +- pub
     +- css
     +- js
     +- img
```

## Configurations

### Global Application Configuration

* **logger** *(Object)* : the logger configuration. This logger may be accessed via
`beyo.logger` and is an instance of [Winston](https://github.com/flatiron/winston). A
typical config would be, for example :

  ```
  {
    "levels": {
      "critical": 6,
      "error": 5,
      "warning": 4,
      "alert": 3,
      "notice": 2,
      "info": 1,
      "debug": 0
    },
    "colors": {
      "critical": "red",
      "error": "bold red",
      "warning": "yellow",
      "alert": "bold yellow",
      "notice": "bold green",
      "info": "green",
      "debug": "blue"
    },
    "level": "debug",
    "transports": {
      "console": {
        "colorize": true,
        "handleExceptions": true,
        "json": false,
        "level": "debug",
        "prettyPrint": true,
        "timestamp": false
      }
    },
    "exitOnError": false
  }
  ```
  All options are treated as is, exception for `transports` and `exceptionHandlers`,
  which are converted into `winston.transport.*` instances automatically, passing
  their options directly to the tranport's constructor. *(Default: `{}`)*

* **modulePaths** *(Array)* : This configuration is mandatory and contains a list of
paths to load MVC modules. It may have an interest for multi-domain projects, where each
domain would have their own `app/modules` structure. Each path are relative to the project's
root directory. *(Mandatory, typically `['app/modules']`)*

* **plugins** *{Object}* : Specify which plugins will be loaded and available globally.
Please refer to the [Plugins](#Plugins) section for more information.


### Module Specific Configuration

*TODO*


## Plugins

Plugins are node modules exposing a single `GeneratorFunction`, configured, and made
available globally throughout the application via the `beyo` (globally) and
`beyo.modules.*` (module-specific) objects.

**TODO** : register plugins and have official Beyo plugins already registered.

Each plugin module's function will receive two arguments : the `beyo` and `moduleData`
objects, and should return their values. For example, the plugin `foo` might look like this :

```javascript
module.exports = function * foo(beyo, moduleData) {
  // NOTE : if moduleData is undefined, the we are loading the plugin globally!
  var pluginValue = 'This is foo!';

  // init plugin stuff...

  return pluginValue;
};
```
Will result in `beyo.foo == 'This is foo!'`.


### Predefined Beyo Plugins

* **i18n** *(beyo-i18n)* : *TODO*
* **model** *(beyo-moddel)* : *TODO*


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
