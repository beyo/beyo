
var glob = require('co-glob');
var path = require('path');

var appLoader = require('./app');
var configLoader = require('./config');
var pluginsLoader = require('./plugins');

/**
Load the given module and return the module info object upon success,
or false upon failure

@param {Beyo}    the beyo module object
@param {string}  the module path

@return {Object} the module info object, or false
*/
module.exports = function * modulesLoader(beyo) {
  var modules = {};
  var modulePaths = beyo.config.modulePaths;
  var modulePath;
  var moduleResult;

  for (var i = 0, iLen = modulePaths.length; i < iLen; i++) {
    var files = yield glob('*', { cwd: modulePaths[i], mark: true });
    for (var j = 0, jLen = files.length; j < jLen; j++) {
      if (files[j].substr(-1) === '/') {
        modulePath = path.join(path.resolve(process.cwd(), modulePaths[i]), files[j]);

        moduleResult = yield loadModule(modulePath, beyo);

        if (moduleResult !== false) {
          modules[files[j].substr(0, files[j].length - 1)] = moduleResult;
        }
      }
    }
  }

  beyo.events.emit('modulesLoadComplete', {
    modules: modules
  });

  return modules;
};

/**
Load a single module
*/
function * loadModule(modulePath, beyo) {
  var moduleData = {};
  var app;
  var plugins;
  var controllerCount;

  beyo.events.emit('beforeModuleLoad', {
    path: modulePath,
    data: moduleData
  });

  beyo.logger.log('debug', '[Module] Loading :', path.relative(process.cwd(), modulePath));

  moduleData.config = yield configLoader(path.join(path.resolve(process.cwd(), modulePath), 'conf'), beyo);

  moduleData.plugins = yield pluginsLoader(beyo, moduleData.config.plugins);
  app = yield loadModuleApp(modulePath, beyo, moduleData);

  // set static paths
  appLoader.registerStaticPaths(beyo, app, moduleData.config.staticPaths);

  controllerCount = yield loadControllers(modulePath, app, beyo, moduleData)

  if (moduleData.loader || controllerCount) {

    beyo.events.emit('afterModuleLoad', {
      path: modulePath,
      app: app,
      data: moduleData
    });

  } else {
    moduleData = false;
  }

  return moduleData;
}


/**
Load the module and return the application to use when loading controllers, etc.

@param {string} the module path
@param {Beyo}   the beyo module object
@param {Object} the module info object

@return {Koa}   the application to use for this module
*/
function * loadModuleApp(modulePath, beyo, moduleData) {
  var loader;
  var app;
  var defaultViewEngine;
  var viewsOptions;

  try {
    loader = beyo.appRequire(modulePath);

    moduleData.loader = modulePath;
  } catch (e) {
    loader = false;

    beyo.logger.log('warn', '[Module loader] Failure detected!', modulePath);
  }

  app = loader && (yield loader(beyo, moduleData)) || beyo.app;

  return app;
}

/**
Load all controllers given a module path

@param {string}  the module path
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the module info object

@return {int}    how many controllers wwere found
*/
function * loadControllers(modulePath, app, beyo, moduleData) {
  var files = yield glob('**/*.js', { cwd: path.join(modulePath, 'controllers') });
  var file;
  var controllers = moduleData.controllers = [];

  for (var i = 0, len = files.length; i < len; i++) {
    file = path.join(modulePath, 'controllers', files[i].replace(/\.js(on)?$/, ''));

    beyo.logger.log('debug', '[Controller] Loading :', path.relative(process.cwd(), file));

    controllers.push(file);

    yield (beyo.appRequire(file)(beyo, app, moduleData));
  }

  return controllers.length;
}
