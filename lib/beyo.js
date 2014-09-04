
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

var errorFactory = require('error-factory');

var ArgumentException = errorFactory('beyo.ArgumentException');
var IllegalStateException = errorFactory('beyo.IllegalStateException');
var InitializationException = errorFactory('beyo.InitializationException');


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
  var server;

  options = initDefaultOptions(options);

  Object.defineProperties(this, {
    'appRoot': {
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

        yield initApplication(this, options);

        if (postInitElements.length) {
          yield parallel(postInitElements);
        }

        this.emit('appReady', this);

        state = STATE_INITIALIZED;
      }
    },
    'start': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function start() {
        var port = parseInt(this.config('server.port'), 10);
        var host = this.config('server.host');

        if (isNaN(port)) {
          throw IllegalStateException('No server configuration found');
        }

        server = startServer(this, port, host);
        this.emit('serverStarted', port, host);
      }
    },
    'stop': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function stop() {
        if (!server) {
          return;
        }

        server = stopServer(this, server);

        this.emit('serverStopped');
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
    'isListening': {
      configurable: false,
      enumerable: true,
      get: function isReady() {
        return !!server;
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

  Object.defineProperty(beyo, 'appRequire', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield applicationRequire(beyo, options)
  });

  // here, we declare config as a separate property because we need `appRequire`
  // to be defined before defining `config`
  Object.defineProperties(beyo, {
    '_config': {
      configurable: false,
      enumerable: false,
      writable: false,
      value: yield configLoader(beyo, { path: path.join('app', 'conf') })
    },
    'config': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: readConfigValue
    }
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
    value: yield appLoader(beyo, options)
  });

  Object.defineProperty(beyo, 'plugins', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield pluginsLoader(beyo, beyo.config.plugins, options)
  });

  Object.defineProperty(beyo, 'modules', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield modulesLoader(beyo, options)
  });

  beyo.emit('afterInitialize', beyo);

}


/**
@param {Beyo} beyo         the Beyo instance
@param {Number} port       the server port
@param {String} host       the server host (optional)

@return {Object}           the HTTP server instance
*/
function startServer(beyo, port, host) {
  if (!port) {
    throw ArgumentException('No port specified');
  }

  return beyo.app.listen(port, host);
}


/**
@param {Beyo} beyo        the Beyo instance
@param {Object} server    the HTTP server instance
*/
function stopServer(beyo, server) {
  server.close();
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
Load the application's main module and expect to return it's `module` object.
Then return a proxy function to require node modules from it's `require`
function.
*/
function * applicationRequire(beyo, options) {
  var appInitModule = require(beyo.appRoot);
  var module = yield appInitModule(beyo, options);

  // TODO : is it possible to test if appModule is, in fact, the module object instance
  //        inside appInitModule?

  if (!module) {
    throw InitializationException('Application main entry point should return it\'s module object');
  } else if (!module.require || (typeof module.require !== 'function') || (path.dirname(module.filename) !== beyo.appRoot)) {
    throw InitializationException('Invalid returned value in application main entry point');
  }

  return function applicationRequire(path) {
    return module.require(path);
  };
}


/**
Attempt to find a package.json file at the root of the application path and
load some information inside beyo.config.app
*/
function loadApplicationPackageInformation(beyo) {
  var packagePath = path.join(beyo.appRoot, 'package.json');
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
Return a configuration value from the specified path
*/
function readConfigValue(path, defValue) {
  return objectUtil.getValue(this._config, path, defValue);
}