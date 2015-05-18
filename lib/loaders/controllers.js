
const CONTROLLERS_GLOB = '**/*.js';

var glob = require('glob');
var path = require('path');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var ControllerLoaderException = errorFactory('beyo.ControllerLoaderException', [ 'message', 'messageData' ]);

/**
Load all the module's controllers for the given path

Options
  - path                      the controller' root path relative to beyo.rootPath
  - moduleName                the module name being loaded
  - context                   the module context to pass to the controller's initialize functions

@event controllerLoad         called before loading a controller
@event controllerLoadError    error while loading a controller
@event controllerLoadComplete called after loading a controller

@param {Beyo} beyo            the beyo module object
@param {Object} options       the loader options
*/
module.exports = function controllersLoader(beyo, options) {
  if (options === undefined) {
    throw ControllerLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ControllerLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ControllerLoaderException('Controllers path not specified');
  } else if (typeof options.path !== 'string') {
    throw ControllerLoaderException('Invalid path value: ' + String(options.path));
  } else if (!('moduleName' in options)) {
    throw ControllerLoaderException('Module name not specified');
  } else if (typeof options.moduleName !== 'string') {
    throw ControllerLoaderException('Invalid module name: ' + String(options.moduleName));
  } else if (!('context' in options)) {
    throw ControllerLoaderException('Module context not specified');
  } else if (!options.context || options.context.__proto__.constructor.name !== 'ModuleContext') {
    throw ControllerLoaderException('Invalid module context: ' + String(options.context));
  }

  return new Promise(function (resolve, reject) {
    glob(CONTROLLERS_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
      if (err) {
        reject(ControllerLoaderException('Error reading services path', { error: err }));
      } else {
        loadControllers(beyo, options, files).then(resolve).catch(reject);
      }
    });
  });
}


function loadControllers(beyo, options, files) {
  return Promise.all(files.map(function (file) {
    return loadController(beyo, options, file);
  })).then(function (results) {
    var controllers = {};

    results && results.forEach(function (data) {
      if (data && data.initResult) {
        controllers[data.controllerFullName] = data.initResult;
      }
    });

    beyo.emit('controllersLoadComplete', controllers);

    return controllers;
  });
}


function loadController(beyo, options, controllerPath) {
  var controllerData = {
    moduleName: options.moduleName,
    controllerName: moduleResUtil.getNameFromFile(controllerPath),
    controllerFullName: moduleResUtil.getNameFromFile(controllerPath, options.moduleName),
    path: controllerPath,
    context: options.context
  };
  var controllerInit;

  beyo.emit('controllerLoad', controllerData);

  try {
    controllerInit = beyo.require(path.join(beyo.rootPath, options.path, controllerPath));

    return controllerInit.call(options.context, beyo).then(function (initResult) {
      controllerData.initResult = initResult;

      beyo.emit('controllerLoaded', controllerData);

      return controllerData;
    }).catch(function (err) {
      controllerData.error = err;
      beyo.emit('controllerLoadError', controllerData);
    });
  } catch (err) {
    controllerData.error = err;
    beyo.emit('controllerLoadError', controllerData);

    return Promise.resolve();
  }
}