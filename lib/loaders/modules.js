
const MODULES_GLOB = '*/module.json';
const MODULE_NAME_REGEX = /^[a-z][a-z0-9-]*$/i;

var glob = require('co-glob');
var path = require('path');
var merge = require('merge');
var errorFactory = require('error-factory');

var configLoader = require('./config');
var modelsLoader = require('./models');
var controllersLoader = require('./controllers');
var servicesLoader = require('./services');

var moduleContext = require('../util/module-context');


var ModuleLoaderException = errorFactory('beyo.ModuleLoaderException', [ 'message', 'loadStack' ]);

/**
Load all the application modules for the given path

Options
  - path                     the modules root path relative to beyo.appRoot

@event moduleLoad            called before loading a module.
@event moduleLoadError       error while loading a module
@event moduleLoadComplete    called after loading a module

@param {Beyo} beyo           the beyo module object
@param {Object} options      the loader options
*/
module.exports = function * modulesLoader(beyo, options) {
  var availableModules;
  var modules = [];
  var moduleDir;
  var module;
  var files;
  var dir;
  var i;
  var iLen;

  if (options === undefined) {
    throw ModuleLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ModuleLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ModuleLoaderException('Modules path not specified');
  } else if (typeof options.path !== 'string') {
    throw ModuleLoaderException('Invalid path value: ' + String(options.path));
  }

  availableModules = options.modules || {};
  files = yield glob(MODULES_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

  // 1. load all module.json
  for (i = 0, iLen = files.length; i < iLen; ++i) {
    moduleDir = getModuleDir(files[i]);

    try {
      module = beyo.appRequire(path.join(beyo.appRoot, options.path, files[i]));
      module.__dirname = path.join(beyo.appRoot, options.path, moduleDir);
    } catch (e) {
      beyo.emit('moduleLoadError', ModuleLoaderException('Could not load moodule.json at: ' + path.join(options.path, moduleDir)), {});
      module = null;
    }

    if (module) {
      // TODO : replace the first two IFs with a more thorough module.json check
      if (!('name' in module)) {
        beyo.emit('moduleLoadError', ModuleLoaderException('No name defined for module at: ' + path.join(options.path, moduleDir)), {});
      } else if ((typeof module.name !== 'string') || !MODULE_NAME_REGEX.test(module.name)) {
        beyo.emit('moduleLoadError', ModuleLoaderException('Invalid module name at: ' + path.join(options.path, moduleDir)), { moduleName: module.name });
      } else if (availableModules[module.name]) {
        beyo.emit('moduleLoadConflict', module, { modules: availableModules });
      } else {
        availableModules[module.name] = module;
        modules.push(module.name);
      }
    }
  }

  // 2. load each modules
  for (i = 0, iLen = modules.length; i < iLen; ++i) {
    yield loadModule(beyo, options, modules[i], availableModules, []);
  }

  // cleanup any unloaded or error'ed module
  for (i = 0, iLen = modules.length; i < iLen; ++i) {
    module = availableModules[modules[i]];
    if (!module.loaded || module.error) {
      delete availableModules[module.name];
    }
  }

  return availableModules;
};


/**
Initialize and load a single module
*/
function * loadModule(beyo, options, moduleName, availableModules, loadStack) {
  var module = availableModules[moduleName];
  var eventData = {
    moduleName: moduleName,
    modules: availableModules
  };
  var inLoadStack = false;
  var modulePath;
  var config;
  var main;
  var context;
  var i;
  var iLen;

  try {

    if (module === undefined) {
      throw ModuleLoaderException('Missing module: ' + moduleName, loadStack);
    } else if (module.loaded) {
      return;
    } else if (loadStack.indexOf(moduleName.toLocaleLowerCase()) > -1) {
      throw ModuleLoaderException('Cyclical dependency found in ' + moduleName, loadStack);
    }

    loadStack.push(moduleName.toLocaleLowerCase());
    inLoadStack = true;

    // check for dependencies (trap cyclical and other errors, too!)
    if (module.dependencies) {
      for (i = 0, iLen = module.dependencies.length; i < iLen; ++i) {
        yield loadModule(beyo, options, module.dependencies[i], availableModules, loadStack);
      }
    }

    beyo.emit('moduleLoad', eventData);

    modulePath = path.relative(beyo.appRoot, module.__dirname)

    config = yield configLoader(beyo, {
      path: path.join(modulePath, 'conf'),
      moduleName: moduleName
    });
    context = moduleContext(module, config);

    // load module bootstrap function
    main = beyo.appRequire(path.join(module.__dirname, module.main || path.sep));

    eventData.initResult = yield main.call(context, beyo);

    module.models = yield modelsLoader(beyo, {
      path: path.join(modulePath, 'models'),
      moduleName: moduleName,
      context: context
    });
    module.services = yield servicesLoader(beyo, {
      path: path.join(modulePath, 'services'),
      moduleName: moduleName,
      context: context
    });
    module.controllers = yield controllersLoader(beyo, {
      path: path.join(modulePath, 'controllers'),
      moduleName: moduleName,
      context: context
    });

    beyo.emit('moduleLoadComplete', eventData);
  } catch (e) {
    beyo.emit('moduleLoadError', e, eventData);
    module && (module.error = e);
  } finally {
    if (inLoadStack) {
      loadStack.pop();
      inLoadStack = false;
    }
  }

  module.loaded = true;
}




/**
Returns the module name from the dirname
*/
//function getModuleName(file) {
//  var dir = getModuleDir(file);
//  return path.basename(dir, path.extname(dir));
//}

/**
Returns the module root directory
*/
function getModuleDir(file) {
  return path.dirname(file);
}