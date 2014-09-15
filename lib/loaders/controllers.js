
const CONTROLLERS_GLOB = '*.js';

var glob = require('co-glob');
var path = require('path');
var errorFactory = require('error-factory');

var ControllerLoaderException = errorFactory('beyo.ControllerLoaderException', [ 'message', 'eventData' ]);

/**
Load all the module's controllers for the given path

Options
  - path                      the controller' root path relative to beyo.appRoot
  - moduleName                the module name being loaded
  - context                   the module context to pass to the controller's initialize functions

@event controllerLoad         called before loading a controller
@event controllerLoadError    error while loading a controller
@event controllerLoadComplete called after loading a controller

@param {Beyo} beyo            the beyo module object
@param {Object} options       the loader options
*/
module.exports = function * controllersLoader(beyo, options) {
  var files;
  var controller;
  var i;
  var iLen;
  var eventData;

  if (!options) {
    throw ControllerLoaderException('No options specified');
  } else if (!options.moduleName) {
    throw ControllerLoaderException('Module name not specified');
  } else if (!options.context) {
    throw ControllerLoaderException('Module context not specified');
  } else if (!options.path) {
    throw ControllerLoaderException('Controllers path not specified');
  }

  eventData = {
    moduleName: options.moduleName,
    context: options.context
  };

  files = yield glob(CONTROLLERS_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    try {
      eventData.controllerName = getModelName(files[i]);

      beyo.emit('controllerLoad', eventData);

      controller = beyo.appRequire(path.join(beyo.appRoot, options.path, files[i]));

      eventData.initResult = yield controller.call(options.context, beyo);

      beyo.emit('controllerLoadComplete', eventData);
    } catch (e) {
      beyo.emit('controllerLoadError', e, eventData);
    }
  }

};


function getModelName(file) {
  return path.basename(file, path.extname(file));
}