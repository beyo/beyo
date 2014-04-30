

const CONTROLLERS_DIR = 'controllers';
const MODELS_DIR = 'models';

var glob = require('co-glob');
var path = require('path');

var appLoader = require('./app');
var configLoader = require('./config');
var pluginsLoader = require('./plugins');

/**
Load all the available modules from the configuration (modulePaths)

@param {Beyo}    the beyo module object

@return {Object} the moduleData mapping for each module
*/
module.exports = function * modulesLoader(beyo) {
  var modules = {};
  var modulePaths = beyo.config.modulePaths;
  var modulePath;
  var moduleResult;
  var moduleName;
  var moduleNameCount;

  for (var i = 0, iLen = modulePaths.length; i < iLen; i++) {
    var files = yield glob('*', { cwd: modulePaths[i], mark: true });
    for (var j = 0, jLen = files.length; j < jLen; j++) {
      if (files[j].substr(-1) === '/') {
        modulePath = path.join(path.resolve(process.cwd(), modulePaths[i]), files[j]);

        moduleResult = yield loadModule(modulePath, beyo);

        if (moduleResult !== false) {
          moduleName = files[j].substr(0, files[j].length - 1);
          moduleNameCount = 0;

          while (modules[moduleName]) {
            moduleName = files[j].substr(0, files[j].length - 1) + '-' + (++moduleNameCount);
          }

          modules[moduleName] = moduleResult;
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
Load the given module and return the module info object upon success,
or false upon failure

@param {String} modulePath      the path to the module
@return {Object|false}          the moduleData object or false if the module could not load
*/
function * loadModule(modulePath, beyo) {
  var moduleData = {};
  var app;
  var plugins;

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

  yield loadModels(modulePath, app, beyo, moduleData);
  yield loadControllers(modulePath, app, beyo, moduleData);

  beyo.events.emit('afterModuleLoad', {
    path: modulePath,
    app: app,
    data: moduleData
  });

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

    moduleData.loader = true;
  } catch (e) {
    moduleData.loader = loader = false;

    beyo.logger.log('warn', '[Module loader] No module loader at!', modulePath);
  }

  app = moduleData.loader && (yield loader(beyo, moduleData)) || beyo.app;

  beyo.events.emit('moduleInitialized', {
    path: modulePath,
    app: app,
    data: moduleData
  });

  return app;
}


/**
Load all controllers given a module path

@param {string}  the module path
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the module info object
*/
function * loadControllers(modulePath, app, beyo, moduleData) {
  var controllersPath = path.join(modulePath, CONTROLLERS_DIR);
  var files = yield glob('*.js', { cwd: controllersPath });
  var file;
  var controllers = moduleData.controllers = {};
  var controllerName;
  var controllerObj;

  for (var i = 0, len = files.length; i < len; i++) {
    controllerName = files[i].replace(/\.js(on)?$/, '');
    file = path.join(controllersPath, controllerName);

    beyo.logger.log('debug', '[Controller] Loading :', path.relative(process.cwd(), file));

    try {
      controllerObj = yield (beyo.appRequire(file)(beyo, app, moduleData));

      controllers[controllerName] = controllerObj || true;

      beyo.events.emit('controllerLoaded', {
        path: file,
        name: controllerName,
        app: app,
        data: moduleData,
        controller: controllerObj
      });

    } catch (e) {
      beyo.logger.log('error', '[Controller]', e.stack);
    }
  }
}


/**
Load all models given a module path

@param {string}  the module path
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the module info object
*/
function * loadModels(modulePath, app, beyo, moduleData) {
  var modelsPath = path.join(modulePath, MODELS_DIR);
  var files = yield glob('*.js', { cwd: modelsPath });
  var file;
  var models = moduleData.models = {};
  var modelName;
  var modelObj;

  for (var i = 0, len = files.length; i < len; i++) {
    modelName = files[i].replace(/\.js(on)?$/, '');
    file = path.join(modelsPath, modelName);

    beyo.logger.log('debug', '[Model] Loading :', path.relative(process.cwd(), file));

    try {
      modelObj = yield (beyo.appRequire(file)(beyo, app, moduleData));

      models[modelName] = modelObj || true;

      beyo.events.emit('modelLoaded', {
        path: file,
        name: modelName,
        app: app,
        data: moduleData,
        model: modelObj
      });

   } catch (e) {
      beyo.logger.log('error', '[Model]', e.stack);
    }
  }
}
