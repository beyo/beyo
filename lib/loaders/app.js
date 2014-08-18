
var path = require('path');
var fs = require('co-fs');
var koa = require('koa');
var mount = require('koa-mount');
var errorFactory = require('error-factory');

var staticPaths = require('../util/static-paths');

var ApplicationError = errorFactory('beyo.ApplicationError');


module.exports = appLoader;


function * appLoader(beyo) {
  var logger = require('koa-logger');
  var appInitModulePath = path.join(beyo.appRoot, 'app', 'index');
  var appInitModule;
  var app;
  var subApps = {};

  if (beyo.app) {
    throw ApplicationError('Application already defined!');
  }

  app = koa();

  app.mountPath = '/';

  Object.defineProperties(beyo, {
   'createSubApp': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function (key, mountPath, baseApp) {
        if (subApps[key]) {
          throw ApplicationError('Sub-application already defined `' + key + '`');
        } else if (key === '*') {
          throw ApplicationError('Invalid Sub-application key `*`');
        }

        return subApps[key] = createSubApp(beyo, key, mountPath, baseApp || app);
      }
    },
    'getApp': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: function getApp(key) {
        if (key === '*') {
          return app;
        } else {
          return subApps[key];
        }
      }
    }
  });

  app.use(logger());

  // if we have an app init module, invoke it
  if (yield fs.exists(appInitModulePath)) {
    appInitModule = require(appInitModulePath);

    app = yield appInitModule(beyo) || app;
  }

  if (beyo.config) {
    staticPaths(beyo, beyo.config.staticPaths);
  }

  beyo.emit('appCreated', {
    app: app
  });

  return app;
}


/**
Create a sub application that is immediately mounted to the baseApp,
or beyo.app (rootApp) if none specified. If no mountPath is specified, the
created application is not mounted, but merely inserted as a middleware to
the baseApp instance.

@param {Beyo} beyo           the beyo instance
@param {String} key          the application key name
@param {String} mountPath    if provided, the relative path to mount the returned instance
@param {Koa} baseApp         (optional) a koa instance that will serve as base application

@return {Koa}                the child koa application, mounted to baseApp (or rootApp)
*/
function createSubApp(beyo, key, mountPath, baseApp) {
  var app;
  var absolutePath;

  app = koa();

  absolutePath = baseApp.mountPath.replace(/\/$/, '') + (mountPath || '');

  Object.defineProperty(app, 'mountPath', {
    configurable: false,
    enumerable: true,
    get: function getMountPath() {
      return absolutePath;
    }
  });

  beyo.emit('subAppCreated', {
    key: key,
    app: app,
    path: mountPath,
    absolutePath: absolutePath
  });

  if (mountPath) {
    baseApp.use(mount(mountPath, app));
  } else {
    baseApp.use(mount(app));
  }

  return app;
}
