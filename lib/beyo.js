
var path = require('path');
var glob = require('co-glob');
var parallel = require('co-parallel');
var EventEmitter = require('events');

var appLoader = require('./loaders/app');
var configLoader = require('./loaders/config');
var pluginsLoader = require('./loaders/plugins');
var loggerLoader = require('./loaders/logger');
var modulesLoader = require('./loaders/modules');

var beyo;

/**
Beyo is a function constructor defining the application's global context
*/
function Beyo(options) {
  options = options || {};

  initDefaultLogger(this);

  // do not lock or freeze these values, if anything changes this, it will most
  // likely break something, so who cares! It will be their problem! Assume this
  // value to be unmodifiable and go on with it.
  this.appRoot = options.cwd || process.cwd();
  this.env = options.env || process.env.NODE_ENV || 'development';
};
require('util').inherits(Beyo, EventEmitter);



module.exports.initApplication = initApplication;


/**
Init Application by specifying it's root require function. This is useful
when requiring specific modules that are not global, and application specific.

@param {Function} appRequire    the application's require function
*/
function * init(appRequire) {
  beyo.emit('beforeInitialize', beyo);

  Object.defineProperty(beyo, 'appRequire', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: appRequire
  });

  // here, we declare config as a separate property because we need `appRequire`
  // to be defined before defining `config`
  Object.defineProperty(beyo, 'config', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield configLoader(path.join(beyo.appRoot, 'app', 'conf'), beyo)
  });

  // this is after config because logger requires the config to be loaded first!
  Object.defineProperty(beyo, 'logger', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield loggerLoader(beyo)
  });

  // again, `plugins` require all of the above before being defined
  Object.defineProperty(beyo, 'plugins', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield pluginsLoader(beyo, beyo.config.plugins)
  });

  beyo.emit('afterInitialize', beyo);
}

/**
Initialize application modules

@param {Object} options        the options to pass to the Beyo instance
*/
function * initApplication(options) {
  var appReady = false;
  var postInitElements = [];
  var appInitModule;
  var appInitContext = {
    init: init
  };

  // now, instanciate Beyo global context
  beyo = new Beyo(options);

  Object.defineProperties(beyo, {
    isReady: {
      configurable: false,
      enumerable: true,
      get: function isReady() {
        return appReady;
      }
    },
    postInit: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function postInit(obj) {
        postInitElements.push(obj);
        return postInitElements.length;
      }
    }
  });

  appInitModule = require(beyo.appRoot);

  yield appInitModule.bind(appInitContext)(beyo);

  // note make two separate calls, because we need beyo.app in modulesLoader!!

  Object.defineProperty(beyo, 'app', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield appLoader(beyo)
  });

  Object.defineProperty(beyo, 'modules', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield modulesLoader(beyo)
  });

  if (postInitElements.length) {
    yield parallel(postInitElements);
  }

  beyo.emit('appReady', beyo);

  return beyo;
}


function initDefaultLogger(beyo) {
  /**
  A default temporary logger. May be overridden
  */
  beyo.logger = {
    log: function(level) {
      if (env !== 'production') {
        arguments[0] = level + ':';
        console.log.apply(console, arguments);
      }
    }
  };

  ['info', 'warn', 'error'].forEach(function (method) {
    beyo.logger[method] = function defaultLogger() {
      if (env !== 'production') {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(method + ':');

        console[method].apply(console, args);
      }
    };
  });
}