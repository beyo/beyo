# Beyo

Beyo Application framework built on top of koa and other goodies.

---

## DEPRECATION NOTICE

The version `0.x` of Beyo is a draft version, assembled for a single project and not really intended to be used just yet. Thus, you will find artefact of WTF code, or other gems, hidden deep in the bowel of the framework. 

This project was started on January 2014 and, while it has proven to run quite well, it is now time to deprecate the `0.x` line in preparation for the `1.x` one that will be better structured and easy to use. The next version is currently in [development](https://github.com/beyo/beyo/tree/dev) and should be ready for a RC in October.

For this reason, it is strongly suggested to prepare to refactor any ongoing project and wait, or help with the code. If you decide to help, be advised that I already have a clear idea of where I'm going with the refactor and a short meeting on IRC (or wherever) should be in order, first. There is much to do and I'm already maintaining a dozen projects, so be patient! (Oh, and I also have a family and personal life, too!)

See you around!

---


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


## TODO

* Implement tests


## Create a New Application

**NOTE**: the requirements to these steps are outdated and, while it might work,
the application stub is outdated and will not start. However, the steps still
illustrates the general idea and this notice will be removed once everything is
sync'ed.

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

**NOTE**: this structure is incomplete and/or may include folders that another
application may not need.


## Configurations

Configuration files are read inside `config` directories of the application (see the
proposed project structure), and may be placed inside subdirectories for maintainability.
Each subdirectory will act as a configuration key. For example, the configuration structre

```
// ./conf/server.json
{
  "server": {
    "host": "0.0.0.0",
    "port": 4044
  }
}
```

```
// ./conf/foo/bar/buz.json
{
  "buzz": {
    "value": "Hello!"
  }
}
```

will generate the configuration object

```
{
  "server": {
    "host": "0.0.0.0",
    "port": 4044
  },
  "foo": {
    "bar": {
      "buz": {
        "value": "Hello!"
      }
    }
  }
}
```

Configuration files may be of type `.json` or `.js`.


### Environment Dependent Config

Any configuration files may be applied to a specific environment setting. For example,
if the server host and port needs to be different between `development`, `staging` and
`production`. To apply a configuration file to a specific environment, append the env
suffix to the file name. If a suffix is defined, the file will be loaded if it matches
the beginning of the environment value. For example, for `development`, these files
will all be loaded :

* server.json
* server.d.json
* server.de.json
* server.dev.json
* ...
* server.development.json

Also, more than one environment may be specified, each separated by a dot. For exemple
configuration files for `development` and `staging` :

* server.json
* server.d.s.json
* ...
* server.dev.stag.json
* ...
* server.development.staging.json


**Note**: suffixes are inclusive only, they cannot specify "all environments but ..."; they
specify "any environment, or ..."


### Global Application Configuration

All loaded configuration files are available via `beyo.config`.

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
root directory. *(Mandatory, typically `['./app/modules']`)*

* **plugins** *{Object}* : Specify which plugins will be loaded and available globally.
Please refer to the [Plugins](#Plugins) section for more information.

* **server** *{Object}* : Specify the server settings. Typically, the host and port that
the server should bind and listen incoming clients from. For example :
  ```
  {
    "host": "0.0.0.0",
    "port": 4044
  }
  ```

* **staticPaths** *{Array}* : Specify an array of path that will be served as static
content from the root application.


### Module Specific Configuration

Each module may define their own personal configuration, which will be aavilable through
the controller's `moduleData`, or `beyo.modules.<module>.config`.

See [module configuration documentation](docs/module-config.md) for more information.


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

A module is a piece of the application. It encapsulate an application feature and is
composed of configuration, controllers, models, views, services, etc. that are specific
to the feature they encapsulate. Modules should be independant from each other and
should not be aware of other modules; they are essentially applications inside an
application.

*NEEDS MORE INFORMATION*


### Controllers

A controller is where routes and middlewares are register to the module's koa instance.
Controllers should be small and concise and should not execute long processes; they
should return as fast as possible. It is recommended to use `Services` for long processes.

*NEEDS MORE INFORMATION*


### Models

Models are also called the "Business Model" and represent the data structure of the
application. They are usually backed by a persistence layer (ex: a database) to be
accessible across processes, clusters and restarts.

Beyo does not enforce a persistence layer on models, neither does it enforce any given
convention, other than a way to load them automatically in an orderly manner.

*NEEDS MORE INFORMATION*


### Views

A view is what is sent to the client (browser) once a controller has completed processing
a request. Views can be HTML, JSON, plain text, etc. and are mainly the feedback that
the user can receive from the application.

Beyo does not enforce any rendering engine or format. Views are documented only as they
are part of the framework acrhitecture (i.e. HMVC).

*NEEDS MORE INFORMATION*


## Events

Almost all aspect of the application can be monitored and managed through events. The
following events are more or less in their corresponding order. Certain events may be
emitted differently due to the asynchronous nature of the framework (and JavaScript).

* **beforeInitialize** *(Beyo)* : emitted when calling `beyo.init()`. The event listeners
will receive the `Beyo` object instance.
* **afterInitialize** *(Beyo)* : emitted when calling `beyo.init()`. The event listeners
will receive the `Beyo` object instance.
* **appCreated** *(Object)* : emitted when the global koa application is created. The event
listeners receive the `app` instance.
* **configLoaded** *(Object)* : emitted when a configuration object has loaded. The
event listeners receive the configuration `path`, the `files` found, and the
`config` object constructed from the them.
* **loggerLoaded** *(Winston)* : emitted when the logger has been loaded. The event
listeners receive the [Winston](https://github.com/flatiron/winston) instance.
* **pluginLoaded** *(Object)* : emitted when a plugin is loaded. The event listeners
receive the plugin's `path`, the actual `plugin` function and it's result (`pluginValue`).
* **pluginsLoadComplete** *{Object}* : emitted when all plugins have been loaded. This event will
be emitted once for the global plugins, then again as many times as there are modules
that have declared plugins in their configuration. The event listeners will receive an
object matching each plugin and their returned values.
* **beforeModuleLoad** *(Object)* : emitted when a module is being loaded. The event
listeners receive the module `path` and it's `data` object.
* **moduleInitialized** *{Object}* : emitted when the module loader (if one found) has been
called, and the module's application is known. The event listeners receive the module `path`,
it's `data` object, and the module's `app` instance.
* **subAppCreated** *{Object}* : emitted when a module creates a sub-applications, mounted to
the main, global, application instance. Event listeners will receive the `app` instance and
the `mounthPath` value.
* **modelLoaded** *{Object}* : emitted when a model was successfully loaded. The event
listeners will receive the model's `path`, the file's base `name` (controller name), the
module's `app` instance, the module's `data` object, and the controller's returned value (may
be undefined).
* **controllerLoaded** *{Object}* : emitted when a controller was successfully loaded. The
event listeners will receive the controller's `path`, the file's base `name` (controller name),
the module's `app` instance, the module's `data` object, and the controller's returned value
(may be undefined).
* **afterModuleLoad** *(Object)* : emitted when a module is being loaded. The event
listeners receive the module `path`, it's `data` object, and the module's
`app` instance.
* **modulesLoadComplete** *{Object}* : emitted when all modules are done loading. The
event listeners will receive the modules object mapping (i.e. same as `beyo.modules`, before
it is set).


## Starting the Application

Beyo make use of two executables to launch the application. Because it requires to have
node's `--harmony` features, the first executable ensures that this flag is set and
initializing all features. The downside to this is that some arguments are only
available in the first executable, and not listed as it is the second executable that
actually display the available commands and help. These "hidden" arguments are :

* **--nodemon** : initialize `nodemon` module, using any `nodemon.json` file available
at the root of the application.
* **--appPath=PATH** : used to start the application anywhere, set the application's
root path. This will change node's current working directory to `PATH`.

To see any other help, just invoke `beyo -h` or `beyo --help`.


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
