
const STATE_UNINITIALIZED = void 0;
const STATE_INITIALIZING = false;
const STATE_INITIALIZED = true;


var path = require('path');
var fs = require('fs');
var glob = require('co-glob');
var merge = require('merge');
var parallel = require('co-parallel');
var EventEmitter = require('events');

var appLoader = require('./loaders/app');
var configLoader = require('./loaders/config');
var pluginsLoader = require('./loaders/plugins');
var loggerLoader = require('./loaders/logger');
var modulesLoader = require('./loaders/modules');

var errorFactory = require('error-factory');

var ArgumentException = errorFactory('beyo.ArgumentException');
var IllegalStateException = errorFactory('beyo.IllegalStateException');

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
require('util').inherits(Beyo, EventEmitter);


/**
Hide implementation inside this "private" function
*/
function _init(options) {
  var state = STATE_UNINITIALIZED;
  var postInitElements = [];
  var server;

  options = initDefaultOptions(options);
  initDefaultLogger(this);

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
        var serverConfig = this.config.server;

        if (!serverConfig) {
          throw IllegalStateException('No server configuration found');
        }

        server = startServer(this, serverConfig.port, serverConfig.host);
        this.emit('serverStarted', serverConfig.port, serverConfig.host);
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
Initialize application config, logger, app, plugins, then modules

@param {Beyo} beyo        the beyo instance
@param {Object} options   some options to pass around
*/
function * initApplication(beyo, options) {
  var appInitModule = require(beyo.appRoot);

  beyo.emit('beforeInitialize', beyo);

  // NOTE : each Object.defineProperty is separate because each step require
  //        the beyo instance to have the previous property defined!

  Object.defineProperty(beyo, 'appRequire', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield appInitModule(beyo, options)
  });

  // here, we declare config as a separate property because we need `appRequire`
  // to be defined before defining `config`
  Object.defineProperty(beyo, 'config', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield configLoader(path.join(beyo.appRoot, 'app', 'conf'), beyo, options)
  });

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
    value: yield appLoader(beyo)
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
A default temporary logger. May be overridden
*/
function initDefaultLogger(beyo) {
  beyo.logger = {
    log: function(level) {
      if (beyo.env !== 'production') {
        arguments[0] = level + ':';
        console.log.apply(console, arguments);
      }
    }
  };

  ['info', 'warn', 'error'].forEach(function (method) {
    beyo.logger[method] = function defaultLogger() {
      if (beyo.env !== 'production') {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(method + ':');

        console[method].apply(console, args);
      }
    };
  });
}