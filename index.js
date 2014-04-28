
var fs = require('co-fs');
var pathJoin = require('path').join;
var glob = require('co-glob');
var koa = require('koa');
var mount = require('koa-mount');

var appLoader = require('./lib/loaders/app');
var configLoader = require('./lib/loaders/config');
var pluginsLoader = require('./lib/loaders/plugins');
var loggerLoader = require('./lib/loaders/logger');
var modulesLoader = require('./lib/loaders/modules');

var env = process.env.NODE_ENV || 'development';
var beyo = module.exports;
var appRoot = module.exports.appRoot = process.cwd();
var events = module.exports.events = new (require('events').EventEmitter);


module.exports.init = init;
module.exports.initApplication = initApplication;
module.exports.createSubApp = createSubApp;


/**
Init Beyo

@param {Function} appRequire    the application's require function
*/
function * init(appRequire) {
  events.emit('beforeInitialize', beyo);

  Object.defineProperties(beyo, {
    env: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: env
    },
    app: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: _createApp()
    },
    appRequire: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: appRequire
    }
  });

  Object.defineProperty(beyo, 'config', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield configLoader(pathJoin(appRoot, 'app', 'conf'), beyo)
  });

  Object.defineProperty(beyo, 'logger', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield loggerLoader(beyo)
  });

  yield loadApplicationPackageInformation(beyo);

  Object.defineProperty(beyo, 'plugins', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: yield pluginsLoader(beyo, beyo.config.plugins)
  });

  events.emit('afterInitialize', beyo);
}

/**
Initialize application modules
*/
function * initApplication() {
  yield appLoader(beyo);

  beyo.modules = yield modulesLoader(beyo);
}


function * loadApplicationPackageInformation(beyo) {
  var packagePath = pathJoin(appRoot, 'package.json');
  if (yield fs.exists(packagePath)) {
    var pkg = require(packagePath);

    beyo.config.app = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      license: pkg.license
    };
  }
}

/**
Create a new koa instance, mount it at path and return it
*/
function createSubApp(path, baseApp) {
  return _createApp(path, baseApp);
}


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
A default temporary logger. May be overridden
*/
['log', 'info', 'warn', 'error'].forEach(function (method) {
  (beyo.logger = beyo.logger || {})[method] = function defaultLogger(level) {
    arguments[0] = level + ':';

    console[method].apply(console, arguments);
  };
});
