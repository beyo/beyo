
const CONTROLLERS_GLOB = '**/*.js';

var glob = require('glob');
var path = require('path');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var ControllerLoaderException = errorFactory('beyo.ControllerLoaderException', [ 'message', 'eventData' ]);

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
module.exports = function * controllersLoader(beyo, options) {
  var controllers = {};
  var files;
  var controllerInit;
  var i;
  var iLen;
  var eventData;

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

  eventData = {
    moduleName: options.moduleName,
    context: options.context
  };

  files = yield glob(CONTROLLERS_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) });

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    try {
      eventData.controllerName = moduleResUtil.getNameFromFile(files[i]);
      eventData.controllerFullName = moduleResUtil.getNameFromFile(files[i], options.moduleName);

      beyo.emit('controllerLoad', eventData);

      controllerInit = beyo.require(path.join(beyo.rootPath, options.path, files[i]));
      eventData.initResult = yield controllerInit.call(options.context, beyo);

      if (eventData.initResult) {
        controllers[eventData.controllerFullName] = eventData.initResult;
      }

      beyo.emit('controllerLoadComplete', eventData);
    } catch (e) {
      beyo.emit('controllerLoadError', e, eventData);
    }
  }

  return controllers;
};