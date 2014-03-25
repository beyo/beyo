# Beyo

Beyo Application framework built on top of koa and other goodies.


## Preamble

This project is an active ongoing project. There will be some changes over time,
and I plan on synchronizing a sample project along with it. More documentation,
and wiki are to be written also.


## (Goal) Features

* Asynchronous API through generator functions [`co`](https://github.com/visionmedia/co) compatible.
* Modular application design using a simple HMVC pattern
* hierarchical configuration
* Unobstructive implementation, just the project structure guideline
* Event driven
* Plugin system
* Middleware system


## Create a New Application

1. Install Beyo globally : `npm install -g beyo`
2. Create your project base directory : `mkdir project`
3. Initialize your application : `beyo init`
4. Run your application : `beyo start`
5. Load the application in the browser at `http://localhost:4044/`
6. <kbd>CTRL+C</kbd> to shut down

That's it!


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

* **middlewares** *{Object}* : Specify which middlewares will be loaded and available globally.
Please refer to the [Middlewares](#Middlewares) section for more information.


### Module Specific Configuration

*TODO*


## Plugins

Plugins are node modules exposing a single `GeneratorFunction`. Once configured, and
executed, the result of each plugin are directly made available globally throughout the
application via the `beyo.plugins` object (using the application's configuration),
or through each modules' `beyo.modules.<moduleName>.plugins` object.

Each plugin module's function will receive two arguments : the `beyo` object, and
the plugin's configuration `options`. Each plugin should return their values. For
example, the plugin `foo` might look like this :

```javascript
// module : node-module-foo
module.exports = function * fooPlugin(beyo, options) {
  var pluginValue = 'This is foo!';

  // init plugin stuff...

  return pluginValue;
};
```

If configured globally, this plugin will result in `beyo.plugins.foo == 'This is foo!'`.

Plugins are installed normally using `npm install node-module-foo --save`, for example.


### Plugin Configuration

To configure a global plugin, declare it inside the application's configuration.
To configure a module plugin, declare it inside the module's configuration. Regardless
how they are loaded, plugins must be decalred inside a `"plugins"` configuration
key. For example :

```
{
  "plugins": {
    "foo": {
      "module": "node-module-foo",
      "options": {
        text: "Hello"
      }
    }
  }
}
```

The above config (i.e. `beyo.config.plugins.foo` or `beyo.modules.?.config.plugins.foo`)
will invoke the `node-module-foo` module with it's `options == { text: "Hello" }`.


## Middlewares

Middlewares are like plugins, but they are intended to be used with koa handlers.
Actually, the are loaded exactly like plugins (at the moment), but they are separated
to avoid confusion, name clash or other mistakes, as they are not intended to be used
the same way as plugins!

One key difference is how they are, in fact, used; middlewares should *always* return
generator functions (where plugins may return anything). Any middleware not complying
to this restriction may raise an exception at load-time. For example :

```javascript
// module : node-module-foo
module.exports = function * authMiddleware(beyo, options) {
  // prepare middle options...

  return function * auth(next) {
    // check if this.req is an auth user, throw an error if not

    yield next();
  };
};
```

If configured globally, this middleware will result in `beyo.middlewares.bar == [Function auth]`,
and may be used directly with `app.use(beyo.middlewares.auth);`.

Middlewares are installed using `npm`, like plugins, too.


### Middleware Configuration

Middlewares are configured like plugins.

```
{
  "middlewares": {
    "bar": {
      "module": "node-module-bar",
      "options": {
      }
    }
  }
}
```


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


## Events

Almost all aspect of the application can be monitored and managed through events.

* **beforeInitialize** *(beyo)* : fired when calling `beyo.init()`
* **afterInitialize** *(beyo)* : fired when calling `beyo.init()`
* **appCreated** *(object)* : fired when a koa application is created. The event
listeners receive the `app` instance, the mounted `path`, and if this `isRoot`
application.
* **configLoaded** *(object)* : fired when a configuration object has loaded. The
event listeners receive the configuration `path`, the `files` found, and the
`config` object constructed from the them.
* **loggerLoaded** *(winston)* : fired when the logger has been loaded. The event
listeners receive the [winston](https://github.com/flatiron/winston) instance.
* **pluginLoaded** *(object)* : fired when a plugin is loaded. The event listeners
receive the plugin's `path`, the actual `plugin` function and it's result (`pluginValue`).
* **beforeModuleLoad** *(object)* : fired when a module is being loaded. The event
listeners receive the module `path` and it's `data` object.
* **afterModuleLoad** *(object)* : fired when a module is being loaded. The event
listeners receive the module `path`, it's `data` object, and the module's
`app` instance.


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
