
const CONF_GLOB = '*/module.json';

const MODULE_NAME_REGEX = /[a-z][a-z0-9-]/i;

const DEFAULT_DIRECTORIES = {
  config: 'conf',
  models: 'models',
  controllers: 'controllers',
  services: 'services'
};

var glob = require('co-glob');
var path = require('path');
var merge = require('merge');
var errorFactory = require('error-factory');

var configLoader = require('./config');

var moduleContext = require('../util/module-context');


//r appLoader = require('./app');
//var pluginsLoader = require('./plugins');

//var staticPaths = require('../util/static-paths');

var ModuleLoaderException = errorFactory('beyo.ModuleLoaderException', [ 'message', 'eventData', 'loadStack' ]);

/**
Load all the application modules for the given path

Options
  - path                    the modules root path relative to beyo.appRoot
  - modulePaths (optional)  an option specifying the configuration, models, controllers and services
                            directories. Will default to "conf", "models", "controllers" and "services"
                            respectively.
                            NOTE : these values may be overridden from the module's module.json file.

@event moduleLoad            called before loading a module.
@event moduleLoadError       error while loading a module
@event moduleLoadConflict    when two modules potentially have the same name
@event moduleLoadComplete    called after loading a module

@param {Beyo} beyo           the beyo module object
@param {Object} options      the options passed to the Beyo instance
*/
module.exports = function * modulesLoader(beyo, options) {
  var availableModules = {};
  var modules = [];
  var moduleDir;
  var moduleName;
  var files;
  var dir;
  var i;
  var iLen;

  if (!(options && options.path)) {
    throw ModuleLoaderException('Modules path not specified');
  }

  files = yield glob(CONF_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

  try {
    // 1. load all module.json
    for (i = 0, iLen = files.length; i < iLen; ++i) {
      moduleDir = getModuleDir(files[i]);
      moduleName = getModuleName(files[i]);
      availableModules[moduleName] = beyo.appRequire(path.join(beyo.appRoot, options.path, files[i]));
      availableModules[moduleName].__dirname = path.join(beyo.appRoot, options.path, moduleDir);
      modules.push(moduleName);
    }

    // 2. load each modules
    for (i = 0, iLen = modules.length; i < iLen; ++i) {
      yield loadModule(beyo, options, modules[i], availableModules, []);
    }
  } catch (e) {
    beyo.emit('moduleLoadError', e, e.eventData || { modules: availableModules });
  }
};


/**
Initialize and load a single module
*/
function * loadModule(beyo, options, moduleName, availableModules, loadStack) {
  var module;
  var eventData;
  var config;
  var main;
  var context;
  var i;
  var iLen;

  module = availableModules[moduleName]
  eventData = {
    moduleName: moduleName,
    modules: availableModules
  };

  if (module === undefined) {
    throw ModuleLoaderException('Missing module: ' + moduleName, eventData, loadStack);
  } else if (module.loaded) {
    return;
  } else if (!MODULE_NAME_REGEX.test(module.name)) {
    throw ModuleLoaderException('Invalid module name in ' + moduleName + ': ' + String(module.name), eventData, loadStack);
  } else if (loadStack.indexOf(moduleName.toLocaleLowerCase()) > -1) {
    throw ModuleLoaderException('Cyclical dependency found in ' + moduleName, eventData, loadStack);
  }

  loadStack.push(moduleName.toLocaleLowerCase());

  if (module.dependencies) {
    for (i = 0, iLen = module.dependencies; i < iLen; ++i) {
      yield loadModule(beyo, options, module.dependencies[i], availableModules, loadStack);
    }
  }

  beyo.emit('moduleLoad', eventData);

  config = yield configLoader(beyo, {
    path: path.join(path.relative(beyo.appRoot, module.__dirname), options.modulePaths && options.modulePaths.config || DEFAULT_DIRECTORIES.config),
    moduleName: moduleName
  });
  context = moduleContext(module, config);
  main = beyo.appRequire(path.join(module.__dirname, module.main || path.sep));

  yield main.call(context, beyo);

  // TODO : 1. load models
  // TODO : 2. load services
  // TODO : 3. load controllers

  beyo.emit('moduleLoadComplete', eventData);

  loadStack.pop();

  module.loaded = true;
}






/**
Load all the available modules from the configuration (modulePaths)

@event modulesLoadError     error while loading config file

@param {Beyo}               the beyo module object
*/
/*
module.exports = function * modulesLoader(beyo, options) {
  var files;
  var modules = {};
  var modulePaths = merge(beyo.config('directories', DEFAULT_DIRECTORIES));
  var modulePath;
  var moduleResult;
  var moduleNames;
  var moduleName;
  var moduleNameCount;
  var i, iLen;
  var j, jLen;
  var k;

  if (!modulePaths) {
    beyo.emit('modulesLoadError', ModuleLoaderException('Module path unspecified'));
    return;
  }



  for (i = 0, iLen = modulePaths.length; i < iLen; i++) {
    var files = yield glob('*', { cwd: modulePaths[i], mark: true });

    for (j = 0, jLen = files.length; j < jLen; j++) {
      // only process module directories...
      if (files[j].substr(-1) === '/') {
        modulePath = path.join(path.resolve(beyo.rootPath, modulePaths[i]), files[j]);

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
          if (!options.quiet) {
            console.warn('[Modules]', 'Possible module name conflict', moduleName);
            // list all conflicting module paths
            for (k = 0; k <= moduleNameCount; ++k) {
              console.warn('[Modules]', '...', modules[getModuleName(files[j])].path);
            }
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
      yield loadModule(moduleName, beyo, options, modules, [moduleName]);
    } catch (e) {
      if (!options.quiet) {
        if (options.showStackTrace) {
          console.error('[Modules]', e.stack || e);
        } else {
          console.error('[Modules]', e.message || e);
        }
      }
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

  beyo.emit('modulesLoadComplete');

  return modules;
};

/**
Load the given module and return the module info object upon success,
or false upon failure

@param {String} moduleName      the name of the module to load
@param {Beyo} beyo              the beyo instance
@param {Object} options         the options passed to the Beyo instance
@param {Object} modules         the known application modules information
@param {Array} callstack        a stack of loading module names to prevent cyclical references
*/
/*function * loadModule(moduleName, beyo, options, modules, callstack) {
  var module = modules[moduleName];
  var moduleData = {};
  var app;
  var plugins;

  if (!module) {
    if (!options.quiet) {
      console.info('[Modules]', 'Trying to load unknown module', moduleName);
    }
    return;
  } else if (module.loaded) {
    return;  // ignore, module already loaded
  }

  // check module dependencies
  moduleData.config = yield configLoader(path.join(path.resolve(beyo.rootPath, module.path), 'conf'), beyo);

  if (moduleData.config.dependencies) {
    for (var i = 0, iLen = moduleData.config.dependencies.length; i < iLen; ++i) {
      if (callstack.indexOf(moduleData.config.dependencies[i]) >= 0) {
        throw ModuleLoaderException('Cyclical dependencies found for `' + moduleData.config.dependencies[i] + '` with callstack : ' + callstack.join(' > '), callstack);
      }

      callstack.push(moduleData.config.dependencies[i]);

      yield loadModule(moduleData.config.dependencies[i], beyo, options, modules, callstack);

      callstack.pop();  // discard callstack for next iteration
    }
  }

  if (!options.quiet && options.verbose) {
    console.info('[Module]', 'Loading :', path.relative(beyo.rootPath, module.path));
  }

  beyo.events.emit('beforeModuleLoad', {
    path: module.path,
    data: moduleData
  });

  moduleData.plugins = yield pluginsLoader(beyo, moduleData.config.plugins);
  app = yield loadModuleApp(module, beyo, options, moduleData);

  // set static paths
  if (moduleData.config.staticPaths) {
    staticPaths(beyo, moduleData.config.staticPaths);
  }

  yield loadModels(module, app, beyo, options, moduleData);
  yield loadControllers(module, app, beyo, options, moduleData);

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
@param {Object} the options passed to the Beyo instance
@param {Object} the module info object

@return {Koa}   the application to use for this module
*/
/*function * loadModuleApp(module, beyo, options, moduleData) {
  var loader;
  var app;
  var defaultViewEngine;
  var viewsOptions;

  try {
    loader = beyo.appRequire(module.path);

    moduleData.loader = true;
  } catch (e) {
    moduleData.loader = loader = false;

    if (!options.quiet) {
      console.warn('[Module]', 'No module loader at!', module.path);
    }
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
@param {Object}  the options passed to the Beyo instance
@param {Object}  the module info object
*/
/*function * loadControllers(module, app, beyo, options, moduleData) {
  var options, controllersPath = path.join(module.path, CONTROLLERS_DIR);
  var files = yield glob('*.js', { cwd: controllersPath });
  var file;
  var controllers = moduleData.controllers = {};
  var controllerName;
  var controllerObj;

  for (var i = 0, len = files.length; i < len; i++) {
    controllerName = files[i].replace(/\.js(on)?$/, '');
    file = path.join(controllersPath, controllerName);

    if (!options.quiet && options.verbose) {
      console.info('[Controller]', 'Loading :', path.relative(beyo.rootPath, file));
    }

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
      if (!options.quiet) {
        if (options.showStackTrace) {
          console.error('[Controller]', e.stack || e);
        } else {
          console.error('[Controller]', e.message || e);
        }
      }
    }
  }
}


/**
Load all models given a module path

@param {Object}  the module's meta data object
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the options passed to the Beyo instance
@param {Object}  the module info object
*/
/*function * loadModels(module, app, beyo, options, moduleData) {
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

    files.sort(function (a, b) {
      var res;

      a = a.replace(/\.js(on)?$/, '');
      b = b.replace(/\.js(on)?$/, '');

      res = isDependant(a, b) ? 1 : isDependant(b, a) ? -1 : 0;

      return res;
    });
  }

  for (var i = 0, len = files.length; i < len; i++) {
    modelName = files[i].replace(/\.js(on)?$/, '');
    file = path.join(modelsPath, modelName);

    if (!options.quiet && options.verbose) {
      console.info('[Model]', 'Loading :', path.relative(beyo.rootPath, file));
    }

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
      if (!options.quiet) {
        if (options.showStackTrace) {
          console.error('[Model]', e.stack || e);
        } else {
          console.error('[Model]', e.message || e);
        }
      }
    }
  }
}



/**
Returns the module name from the dirname
*/
function getModuleName(file) {
  var dir = getModuleDir(file);
  return path.basename(dir, path.extname(dir));
}

/**
Returns the module root directory
*/
function getModuleDir(file) {
  return path.dirname(file);
}