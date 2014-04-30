
var path = require('path');

var koa = require('koa');
var mount = require('koa-mount');
var serve = require('koa-static');

var errorFactory = require('error-factory');

var ApplicationError = errorFactory('beyo.ApplicationError');


module.exports = appLoader;
module.exports.registerStaticPaths = registerStaticPaths;


function * appLoader(beyo) {
  var app;

  if (beyo.app) {
    throw ApplicationError('Application already defined!');
  }

  app = createApp(beyo);

  if (beyo.config) {
    registerStaticPaths(beyo, app, beyo.config.staticPaths);
  }

}

function createApp(beyo) {
  var app = koa();

  app.mountPath = '/';

  Object.defineProperties(beyo, {
    app: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: app
    },
    createSubApp: {
      configurable: false,
      enumerable: true,
      writable: false,
      value: getCreateSubApp(beyo, app)
    }
  });

  beyo.events.emit('appCreated', {
    app: app
  });

  return app;
}

function getCreateSubApp(beyo, rootApp) {
  return function createSubApp(mountPath, baseApp) {
    var app;

    if (!mountPath || typeof mountPath !== 'string') {
      throw ApplicationError('Mount path must be a non-empty string');
    }

    baseApp = baseApp || rootApp;
    app = koa();

    Object.defineProperty(app, 'mountPath', {
      configurable: false,
      enumerable: true,
      get: function getMountPath() {
        return baseApp.mountPath.replace(/\/$/, '') + mountPath;
      }
    });

    beyo.events.emit('subAppCreated', {
      app: app,
      path: mountPath
    });

    baseApp.use(mount(mountPath, app));

    return app;
  };
}


function registerStaticPaths(beyo, app, paths) {

  if (paths) {
    if (!(paths instanceof Array)) {
      beyo.logger.log('debug', '[Static path] Binding :', path.relative(process.cwd(), paths));
      app.use(serve(paths));
    } else {
      paths.forEach(function (staticPath) {
        beyo.logger.log('debug', '[Static path] Binding :', path.relative(process.cwd(), staticPath));
        app.use(serve(staticPath));
      });
    }
  }

}
