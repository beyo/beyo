

const CONTROLLERS_DIR = 'controllers';
const MODELS_DIR = 'models';

var glob = require('co-glob');
var path = require('path');

var appLoader = require('./app');
var configLoader = require('./config');
var pluginsLoader = require('./plugins');

var errorFactory = require('error-factory');

var ModuleLoaderException = errorFactory('beyo.ModuleLoaderException', [ 'message', 'callstack' ]);

/**
Load all the available modules from the configuration (modulePaths)

@param {Beyo}    the beyo module object

@return {Object} the moduleData mapping for each module
*/
module.exports = function * modulesLoader(beyo) {
  var files;
  var modules = {};
  var modulePaths = beyo.config.modulePaths;
  var modulePath;
  var moduleResult;
  var moduleNames;
  var moduleName;
  var moduleNameCount;
  var i, iLen;
  var j, jLen;
  var k;

  function getModuleName(file) {
    return file.substr(0, file.length - 1);
  }

  for (i = 0, iLen = modulePaths.length; i < iLen; i++) {
    var files = yield glob('*', { cwd: modulePaths[i], mark: true });

    for (j = 0, jLen = files.length; j < jLen; j++) {
      // only process module directories...
      if (files[j].substr(-1) === '/') {
        modulePath = path.join(path.resolve(process.cwd(), modulePaths[i]), files[j]);

        moduleNameCount = 0;
        moduleName = getModuleName(files[j]);

        while (modules[moduleName]) {
          moduleName = getModuleName(files[j]) + '-' + (++moduleNameCount);
        }

        modules[moduleName] = {
          loaded: false,
          path: modulePath,
        };

        if (moduleNameCount > 0) {
          beyo.logger.log('warning', 'Possible module name conflict ' + moduleName);
          // list all conflicting module paths
          for (k = 0; k <= moduleNameCount; ++k) {
            beyo.logger.log('warning', '...', modules[getModuleName(files[j])].path);
          }
        }
      }
    }
  }

  // now, load modules
  moduleNames = Object.keys(modules);

  for (i = 0, iLen = moduleNames.length; i < iLen; ++i) {
    moduleName = moduleNames[i];

    try {
      yield loadModule(moduleName, beyo, modules, [moduleName]);
    } catch (e) {
      beyo.logger.log('error', e.stack || e);
      modules[moduleName].error = e;
    }
  }

  // `modules` cleanup...
  for (i = 0, iLen = moduleNames.length; i < iLen; ++i) {
    moduleName = moduleNames[i];
    
    if (modules[moduleName].loaded && modules[moduleName].value) {
      modules[moduleName] = modules[moduleName].value;
    } else {
      delete modules[moduleName];
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

@param {String} moduleName      the name of the module to load
@param {Beyo} beyo              the beyo instance
@param {Object} modules         the known application modules information
@param {Array} callstack        a stack of loading module names to prevent cyclical references
*/
function * loadModule(moduleName, beyo, modules, callstack) {
  var module = modules[moduleName];
  var moduleData = {};
  var app;
  var plugins;

  if (!module) {
    beyo.logger.log('info', 'Trying to load unknown module', moduleName);
    return;
  } else if (module.loaded) {
    return;  // ignore, module already loaded
  }

  // check module dependencies
  moduleData.config = yield configLoader(path.join(path.resolve(process.cwd(), module.path), 'conf'), beyo);

  if (moduleData.config.dependencies) {
    for (var i = 0, iLen = moduleData.config.dependencies.length; i < iLen; ++i) {
      if (callstack.indexOf(moduleData.config.dependencies[i]) >= 0) {
        throw ModuleLoaderException('Cyclical dependencies found for `' + moduleData.config.dependencies[i] + '` with callstack : ' + callstack.join(' > '), callstack);
      }

      callstack.push(moduleData.config.dependencies[i]);

      yield loadModule(moduleData.config.dependencies[i], beyo, modules, callstack);

      callstack.pop();  // discard callstack for next iteration
    }
  }

  beyo.logger.log('debug', '[Module] Loading :', path.relative(process.cwd(), module.path));

  beyo.events.emit('beforeModuleLoad', {
    path: module.path,
    data: moduleData
  });

  moduleData.plugins = yield pluginsLoader(beyo, moduleData.config.plugins);
  app = yield loadModuleApp(module, beyo, moduleData);

  // set static paths
  if (moduleData.config.staticPaths) {
    appLoader.registerStaticPaths(beyo, moduleData.config.staticPaths);
  }

  yield loadModels(module, app, beyo, moduleData);
  yield loadControllers(module, app, beyo, moduleData);

  beyo.events.emit('afterModuleLoad', {
    path: module.path,
    app: app,
    data: moduleData
  });

  module.loaded = true;
  module.value = moduleData;
}


/**
Load the module and return the application to use when loading controllers, etc.

@param {Object} the module's meta data object
@param {Beyo}   the beyo module object
@param {Object} the module info object

@return {Koa}   the application to use for this module
*/
function * loadModuleApp(module, beyo, moduleData) {
  var loader;
  var app;
  var defaultViewEngine;
  var viewsOptions;

  try {
    loader = beyo.appRequire(module.path);

    moduleData.loader = true;
  } catch (e) {
    moduleData.loader = loader = false;

    beyo.logger.log('warn', '[Module loader] No module loader at!', module.path);
  }

  app = moduleData.loader && (yield loader(beyo, moduleData)) || beyo.app;

  beyo.events.emit('moduleInitialized', {
    path: module.path,
    app: app,
    data: moduleData
  });

  return app;
}


/**
Load all controllers given a module path

@param {Object}  the module's meta data object
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the module info object
*/
function * loadControllers(module, app, beyo, moduleData) {
  var controllersPath = path.join(module.path, CONTROLLERS_DIR);
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

@param {Object}  the module's meta data object
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the module info object
*/
function * loadModels(module, app, beyo, moduleData) {
  var modelsPath = path.join(module.path, MODELS_DIR);
  var files = yield glob('*.js', { cwd: modelsPath });
  var file;
  var models = moduleData.models = {};
  var modelName;
  var modelObj;
  var deps;

  // if models dependencies are defined, then sort the model files to load dependencies first
  if (deps = moduleData.config.modelDependencies) {
    function isDependant(parent, child) {
      if (parent === child) {
        return true;
      } else if (deps[parent]) {
        for (var i = 0, iLen = deps[parent].length; i < iLen; ++i) {
          if (isDependant(deps[parent][i], child)) {
            return true;
          }
        }
      }
      return false;
    }

    //console.log("*** MODEL DEPS", JSON.stringify(files, null, 2), JSON.stringify(deps, null, 2));

    files.sort(function (a, b) {
      var res;

      a = a.replace(/\.js(on)?$/, '');
      b = b.replace(/\.js(on)?$/, '');

      //console.log(">>> ", a, "->", b, isDependant(a, b), isDependant(b, a));

      res = isDependant(a, b) ? 1 : -1; // isDependant(b, a) ? -1 : 0;

      return res;
    });

    //console.log("===", JSON.stringify(files, null, 2));
  }

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
