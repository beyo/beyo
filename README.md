# Beyo

Beyo Application framework built on top of koa and other goodies.


## Preamble

This project is an active ongoing project. There will be some changes over time,
and I plan on synchronizing a sample project along with it. More documentation,
and wiki are to be written also. Therefore, this is not a production-ready
framework and all contributions welcome!


## (Goal) Features

* Asynchronous API through generator functions [`co`](https://github.com/visionmedia/co) compatible.
* Modular application design using a simple HMVC pattern
* Hierarchical configuration, environment aware
* Unobstructive implementation, just the project structure guideline
* Event driven
* Plugin system


## Create a New Application

1. Install Beyo globally : `npm install -g beyo`
1. Install [Bower](http://bower.io/) : `npm install -g bower`
3. Create your project base directory : `mkdir project`, then `cd project`
4. Initialize your application : `beyo init`
5. Run your application : `beyo start`
6. Load the application in the browser at `http://localhost:4044/`
7. <kbd>CTRL+C</kbd> to shut down

That's it!


## Project structure

A typical Beyo application project have this structure.

```
- ./project-root
  +- /app
  |  +- /conf
  |  |  +- index.json
  |  +- /layouts
  |  +- /locales
  |  +- /modules
  |  |  +- /demo
  |  |     +- /conf
  |  |     +- /controllers
  |  |     +- /locales
  |  |     +- /models
  |  |     +- /pub
  |  |     +- /services
  |  |     +- /views
  |  |     +- index.js
  |  +- index.js
  +- /bin
  |  +- /commands
  +- /lib
  +- /plugins
  +- /pub
  |  +- /css
  |  +- /js
  |  +- /img
  +- /test
  +- index.js
  +- nodemon.json
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

* **server** *{Object}* : Specify the server settings. Typically, the host and port that
the server should bind and listen incoming clients from. For example :
  ```
  {
    "server": {
      "host": "0.0.0.0",
      "port": 4044
    }
  }
  ```


### Module Specific Configuration

*TODO*


## Plugins

Plugins are node modules exposing a single *yieldable* value. Once configured, and
executed, the result of each plugins are directly made available globally throughout the
application via the `beyo.plugins` object (using the application's configuration),
or through each modules' `beyo.modules.<moduleName>.plugins` object, unless the plugin's
yieldable returns `undefined`.

Each plugin module's function will receive two arguments : the `beyo` object, and
the plugin's configuration `options`. Each plugin should return their values. For
example, the plugin `foo` might look like this :

```javascript
// module : node-module-foo
module.exports = function * fooPlugin(beyo, options) {
  var pluginValue = options || { text: 'This is foo!' };

  // init plugin stuff...

  return pluginValue;
};
```

If configured globally, this plugin will result in `beyo.plugins.foo.text == 'This is foo!'`.

Plugins are standad modules installed normally using `npm install node-module-foo --save`,
for example.

**NOTE** : applications can create custom plugins, too. The `module` configuration key
must be a valid required module. Since the plugins loader uses the application's
`require` function, a module defined as `./plugins/custom-module-foo` will load the
file relative to the application's root directory.


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
