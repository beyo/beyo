
var fs = require('fs');
var glob = require('co-glob');
var koa = require('koa');
var mount = require('koa-mount');

var configLoader = require('./lib/loaders/config');
var pluginsLoader = require('./lib/loaders/plugins');
var middlewaresLoader = require('./lib/loaders/middlewares');
var loggerLoader = require('./lib/loaders/logger');
var modulesLoader = require('./lib/loaders/modules');

var env = process.env.NODE_ENV || 'development';
var beyo = module.exports;
var appRoot = module.exports.appRoot = process.cwd();
//var appPackage = require(appRoot + '/package');
var events = module.exports.events = new (require('events').EventEmitter);


module.exports.init = function * init(appRequire) {
  events.emit('beforeInitialize', beyo);

  Object.defineProperty(module.exports, 'app', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: _createApp()
  });

  beyo.appRequire = appRequire;
  beyo.config = yield configLoader(appRoot + '/conf', beyo);
  beyo.logger = yield loggerLoader(beyo);
  beyo.plugins = yield pluginsLoader(beyo, beyo.config.plugins);
  beyo.middlewares = yield middlewaresLoader(beyo, beyo.config.middlewares);

  events.emit('afterInitialize', beyo);
};

module.exports.initApplication = function * initApplication() {
  beyo.modules = yield modulesLoader(beyo);
};


/**
Create a new koa instance, mount it at path and return it
*/
module.exports.createSubApp = function createSubApp(path, baseApp) {
  return _createApp(path, baseApp);
};


function _createApp(mountPath, baseApp) {
  var app = koa();
  var isRoot = !mountPath;

  if (isRoot) {
    mountPath = undefined;
  } else {
    if (typeof mountPath !== 'string') {
      throw new Error('Mount path must be a string : ' + String(mountPath));
    }
  }

  events.emit('appCreated', {
    app: app,
    path: mountPath,
    isRoot: isRoot
  });

  if (mountPath) {
    baseApp = baseApp || beyo.app;

    baseApp.use(mount(mountPath, app));
  }

  return app;
}


/**
A default logger. May be overridden
*/
beyo.logger = {
  log: function defaultLogger(level) {
    var args = Array.prototype.slice.call(arguments, 1);

    args[0] = level + ': ' + args[0];

    console.log.apply(console, args);
  }
};
