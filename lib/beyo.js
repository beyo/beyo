
const STATE_UNINITIALIZED = void 0;
const STATE_INITIALIZING = false;
const STATE_INITIALIZED = true;

var path = require('path');
var fs = require('fs');
var glob = require('co-glob');
var merge = require('merge');
var parallel = require('co-parallel');
var Module = require('module');

var appLoader = require('./loaders/app');
var configLoader = require('./loaders/config');
var pluginsLoader = require('./loaders/plugins');
var loggerLoader = require('./loaders/logger');
var modulesLoader = require('./loaders/modules');

var objectUtil = require('./util/object');
var resourcesUtil = require('./util/resources');

var errorFactory = require('error-factory');

var ArgumentException = errorFactory('beyo.ArgumentException');
var IllegalStateException = errorFactory('beyo.IllegalStateException');
var InitializationException = errorFactory('beyo.InitializationException', ['message', 'messageData']);


/**
Export Beyo
*/
module.exports = Beyo;


/**
Beyo is a function constructor defining the application's global context
*/
function Beyo(options) {
  _init.call(this, options);
};
require('util').inherits(Beyo, require('events').EventEmitter);


/**
Hide implementation inside this "private" function
*/
function _init(options) {
  var state = STATE_UNINITIALIZED;
  var postInitElements = [];

  options = initDefaultOptions(options);

  Object.defineProperties(this, {
    'rootPath': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: options.cwd
    },
    'env': {
      configurable: false,
      enumerable: true,
      get: function getEnv() {
        return options.env || process.env.NODE_ENV || 'development';
      },
      set: function setEnv(env) {
        options.env = process.env.NODE_ENV = env;
      }
    },
    'init': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function * init() {
        if (state !== STATE_UNINITIALIZED) {
          throw IllegalStateException('Method has already been called');
        }

        state = STATE_INITIALIZING;

        try {
          yield initApplication(this, options);

          if (postInitElements.length) {
            yield parallel(postInitElements);
          }

          this.emit('ready', this);

          state = STATE_INITIALIZED;
        } catch (e) {
          state = e;

          throw e;
        }
      }
    },
    'isInitializing': {
      configurable: false,
      enumerable: true,
      get: function isInitializing() {
        return state === STATE_INITIALIZING;
      }
    },
    'isReady': {
      configurable: false,
      enumerable: true,
      get: function isReady() {
        return state === STATE_INITIALIZED;
      }
    },
    'postInit': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function postInit(obj) {
        postInitElements.push(obj);
        return postInitElements.length;
      }
    }
  });
}


/**
Initialize application config, logger, app, plugins, then modules

@param {Beyo} beyo        the beyo instance
@param {Object} options   some options to pass around
*/
function * initApplication(beyo, options) {
  beyo.emit('beforeInitialize', beyo);

  // NOTE : each Object.defineProperty is separate because each step require
  //        the beyo instance to have the previous property defined!

  Object.defineProperty(beyo, 'require', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield applicationRequire(beyo, options)
  });

  // here, we declare config as a separate property because we need `require`
  // to be defined before defining `config`
  Object.defineProperty(beyo, 'config', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield applicationConfig(beyo, options)
  });

  // merge with package.json. This is done after to overwrite any config declaring
  // something "reserved"
  loadApplicationPackageInformation(beyo);

  // this is after config because logger requires the config to be loaded first!
  Object.defineProperty(beyo, 'logger', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield loggerLoader(beyo, options)
  });

  Object.defineProperty(beyo, 'app', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield appLoader(beyo, { path: path.join('app') })
  });

  Object.defineProperty(beyo, 'plugins', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield initPlugins(beyo, options)
  });

  yield initHMVC(beyo, options);

  beyo.emit('afterInitialize', beyo);
}


function * initPlugins(beyo, options) {
  var plugins = yield pluginsLoader(beyo, { plugins: beyo.config('plugins', {}), path: 'plugins' });
  var pluginKeys = Object.keys(plugins);

  function getPlugin(key) {
    if (!key) {
      throw ArgumentException('Unspecified plugin key');
    } else if (typeof key !== 'string') {
      throw ArgumentException('Plugin key must be a string: ' + String(key));
    //} else if (!plugins[key]) {
    //  throw ArgumentException('Unknown plugin: ' + String(key));
    }

    return plugins[key];
  }

  // do not allow modifying this array
  Object.freeze(pluginKeys);

  // bind a list of available plugin names
  Object.defineProperty(getPlugin, 'available', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: pluginKeys
  });

  return getPlugin;
}


function * initHMVC(beyo, options) {
  var modules = {};
  var moduleKeys;
  var modelKeys = [];
  var serviceKeys = [];

  function _getValue(key, property) {
    var parts;
    var module;
    var i;
    var iLen;
    var value;

    if (!key) {
      throw ArgumentException('Unspecified ' + property.substring(0, property.length - 1) + ' key');
    } else if (typeof key !== 'string') {
      throw ArgumentException(property.replace(/^./, function (m) { return m.toLocaleUpperCase(); }) + ' key must be a string: ' + String(key));
    //} else if (!plugins[key]) {
    //  throw ArgumentException('Unknown ' + property.substring(0, property.length - 1) + ': ' + String(key));
    }

    parts =  key.split(resourcesUtil.MODULE_SEP);

    if (!parts.length || parts.length > 2) {
      throw ArgumentException('Invalid ' + property.substring(0, property.length - 1) + ' key: ' + String(key));
    }

    // moduleName was specified
    if (parts[1]) {
      module = modules[parts[0]];

      value = module && module[property][parts[0] + resourcesUtil.MODULE_SEP + parts[1]];
    } else {
      for (i = 0, iLen = moduleKeys.length; i < iLen && !value; ++i) {
        module = modules[moduleKeys[i]];

        value = module && module[property][moduleKeys[i] + resourcesUtil.MODULE_SEP + parts[0]];
      }
    }

    return value;
  }

  function getModel(key) {
    return _getValue(key, 'models');
  }

  function getService(key) {
    return _getValue(key, 'services');
  }

  Object.defineProperty(getModel, 'available', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: modelKeys
  });

  Object.defineProperty(getService, 'available', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: serviceKeys
  });

  Object.defineProperties(beyo, {
    'models': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: getModel
    },
    'services': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: getService
    }
  });

  beyo.on('modelLoadComplete', function (evt) {
    modelKeys.push(evt.modelFullName);
  });
  beyo.on('serviceLoadComplete', function (evt) {
    serviceKeys.push(evt.serviceFullName);
  });

  beyo.on('modulesLoadComplete', function () {
    Object.freeze(modelKeys);
    Object.freeze(serviceKeys);
  });

  modules = yield modulesLoader(beyo, { path: path.join('app', 'modules'), modules: modules });
  moduleKeys = Object.keys(modules);
}


/**
If we find a `.beyo.json` file inside the current directory, use it to default
options, then return the options.
*/
function initDefaultOptions(options) {
  var beyoConf;
  var beyoConfPath;

  options = options || {};

  options.cwd = options.cwd || process.cwd();

  beyoConfPath = path.join(options.cwd, '.beyo.json');

  if (fs.existsSync(beyoConfPath)) {
    beyoConf = require(beyoConfPath);

    options = merge(true, beyoConf, options);
  }

  // if we have an `env` option, update Node's env variable
  if (options.env) {
    process.env.NODE_ENV = options.env;
  }

  return options;
}


/**
Attempt to find a package.json file at the root of the application path and
load some information inside beyo.config.app
*/
function loadApplicationPackageInformation(beyo) {
  var packagePath = path.join(beyo.rootPath, 'package.json');
  var pkg;

  if (fs.existsSync(packagePath)) {
    pkg = require(packagePath);

    beyo.config.app = merge(true, beyo.config.app || {}, {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      license: pkg.license
    });
  }
}


/**
Load the application's main module and expect to return it's `module` object.
Then return a proxy function to require node modules from it's `require`
function.
*/
function * applicationRequire(beyo, options) {
  var appInitModule = require(beyo.rootPath);
  var module;

  try {
    module = yield appInitModule.call(options, beyo);

    // TODO : is it possible to test if appModule is, in fact, the module object instance
    //        inside appInitModule?

    if (!module) {
      throw InitializationException('Application main entry point should return it\'s module object');
    } else if (!module.require || (typeof module.require !== 'function') || (path.dirname(module.filename) !== beyo.rootPath)) {
      throw InitializationException('Invalid returned value in application main entry point');
    }

  } catch (e) {
    throw InitializationException('Error in application init module', { path: beyo.rootPath, initModule: appInitModule, error: e });
  }

  return function applicationRequire(path) {
    return module.require(path);
  };
}


/**
Return a configuration value from the specified path
*/
function * applicationConfig(beyo, options) {
  var config = yield configLoader(beyo, { path: path.join('app', 'conf') });

  function getConfig(path, defValue) {
    return objectUtil.getValue(config, path, defValue);
  }

  Object.defineProperty(getConfig, '_config', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: config
  });

  return getConfig;
}