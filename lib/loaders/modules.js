
const MODULES_GLOB = '*/module.json';

var glob = require('glob');
var fs = require('fs');
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
  - path                     the modules root path relative to beyo.rootPath

@event moduleLoad            called before loading a module.
@event moduleLoadError       error while loading a module
@event moduleLoadComplete    called after loading a module

@param {Beyo} beyo           the beyo module object
@param {Object} options      the loader options
*/
module.exports = function modulesLoader(beyo, options) {
  if (options === undefined) {
    throw ModuleLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ModuleLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ModuleLoaderException('Modules path not specified');
  } else if (typeof options.path !== 'string') {
    throw ModuleLoaderException('Invalid path value: ' + String(options.path));
  }

  return new Promise(function (resolve, reject) {
    fs.access(path.join(beyo.rootPath, options.path), fs.R_OK, function (err) {
      if (err) {
        reject(ModuleLoaderException('Invalid modules path', { error: err }));
      } else {
        glob(MODULES_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
          if (err) {
            reject(ModuleLoaderException('Cannot list files in modules path: ' + String(options.path)));
          } else {
            loadModules(beyo, options, files).then(resolve).catch(reject);
          }
        });
      }
    });
  });
}

function loadModules(beyo, options, files) {
  var i;
  var iLen;
  var loaders = [];
  var availableModules = options.modules || {};

  for (i = 0, iLen = files.length; i < iLen; ++i) (function (i) {
    var modulePath = path.join(beyo.rootPath, options.path, files[i]);
    var moduleData = {
      path: path.join(options.path, getModuleDir(files[i]))
    };

    try {
      moduleData.module = beyo.require(modulePath);

      // TODO : replace the first two IFs with a more thorough module.json check
      if (!('name' in moduleData.module)) {
        throw ModuleLoaderException('No name defined for module at: ' + moduleData.path);
      } else if (typeof moduleData.module.name !== 'string') {
        throw ModuleLoaderException('Module name must be a string at: ' + moduleData.path);
      } else if (moduleData.module.name in availableModules) {
        beyo.emit('moduleLoadConflict', moduleData, availableModules);
      } else {
        availableModules[moduleData.module.name] = moduleData;

        loaders.push(loadModule(beyo, options, moduleData.module.name, availableModules, []));
      }
    } catch (e) {
      moduleData.error = e;
      beyo.emit('moduleLoadError', moduleData, availableModules);
    }
  })(i);

  return Promise.all(loaders).then(function () {
    beyo.emit('modulesLoadComplete', { modules: availableModules });

    // remove error'd modules
    Object.keys(availableModules).forEach(function (moduleName) {
      if ('error' in availableModules[moduleName]) {
        delete availableModules[moduleName];
      }
    });

    return availableModules;
  });
}


function loadModule(beyo, options, moduleName, availableModules, loadStack) {
  var moduleData = availableModules[moduleName];

  if (moduleData === undefined) {
    throw ModuleLoaderException('Missing module: ' + moduleName, loadStack);
  } else if (loadStack.indexOf(moduleName.toLocaleLowerCase()) > -1) {
    throw ModuleLoaderException('Cyclical dependency found in ' + moduleName, loadStack);
  } else if (!moduleData.promise) {

    loadStack.push(moduleName.toLocaleLowerCase());

    moduleData.promise = loadModuleDependencies(beyo, options, moduleData.module.dependencies, availableModules, loadStack)
      .then(function () {
        return configLoader(beyo, {
          path: path.join(moduleData.path, 'conf'),
          moduleName: moduleName
        }).catch(function (err) {
          return {};   // no config
        });
      })
      .then(function (config) {
        var modulePath = path.join(beyo.rootPath, moduleData.path, module.main || path.sep);
        var context = moduleData.context = moduleContext(moduleData.module, config);
        var main;

        beyo.emit('moduleLoad', moduleData);

        main = beyo.require(modulePath);

        return main.call(context, beyo)
          .then(function (initResult) {
            module.initResult = initResult;
          })
          //.catch(function () {
          //   console.log("*** MODULES LOADER ERROR", moduleName, err.stack);
          //})
          .then(function () {
            return modelsLoader(beyo, {
                path: path.join(moduleData.path, 'models'),
                moduleName: moduleName,
                context: context
              }).then(function (models) {
                moduleData.models = models;
              })
            ;
          })
          .then(function () {
            return servicesLoader(beyo, {
                path: path.join(moduleData.path, 'services'),
                moduleName: moduleName,
                context: context
              }).then(function (services) {
                moduleData.services = services;
              })
            ;
          })
          .then(function () {
            return controllersLoader(beyo, {
                path: path.join(moduleData.path, 'controllers'),
                moduleName: moduleName,
                context: context
              }).then(function (controllers) {
                moduleData.controllers = controllers;
              })
            ;
          })
          .then(function () {
            beyo.emit('moduleLoadComplete', moduleData, availableModules);
          })
        ;
      })
      .then(function () {
        loadStack.pop();

        return moduleData;
      })
    ;
  }

  return moduleData.promise;
}


function loadModuleDependencies(beyo, options, dependencies, availableModules, loadStack) {
  var depLoaders = [];

  if (dependencies && dependencies.length) {
    for (i = 0, iLen = dependencies.length; i < iLen; ++i) {
      depLoaders.push(loadModule(beyo, options, dependencies[i], availableModules, loadStack).catch(function () {
        console.error("**** DEPS ERROR", arguments);
      }));
    }
  }

  return Promise.all(depLoaders);
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