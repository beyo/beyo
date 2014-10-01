
const MODELS_GLOB = '**/*.js';

var path = require('path');
var glob = require('co-glob');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var ModelLoaderException = errorFactory('beyo.ModelLoaderException', [ 'message', 'eventData' ]);



/**
Load all the module's models for the given path

Options
  - path                     the models' root path relative to beyo.appRoot
  - moduleName               the module name being loaded
  - context                  the module context to pass to the model's initialize functions

@event modelLoad             called before loading a model
@event modelLoadError        error while loading a model
@event modelLoadComplete     called after loading a model

@param {Beyo} beyo           the beyo module object
@param {Object} options      the loader options
*/
module.exports = function * modelsLoader(beyo, options) {
  var models = {};
  var files;
  var modelInit;
  var i;
  var iLen;
  var eventData;


  if (options === undefined) {
    throw ModelLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ModelLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ModelLoaderException('Models path not specified');
  } else if (typeof options.path !== 'string') {
    throw ModelLoaderException('Invalid path value: ' + String(options.path));
  } else if (!('moduleName' in options)) {
    throw ModelLoaderException('Module name not specified');
  } else if (typeof options.moduleName !== 'string') {
    throw ModelLoaderException('Invalid module name: ' + String(options.moduleName));
  } else if (!('context' in options)) {
    throw ModelLoaderException('Module context not specified');
  } else if (!options.context || options.context.__proto__.constructor.name !== 'ModuleContext') {
    throw ModelLoaderException('Invalid module context: ' + String(options.context));
  }

  eventData = {
    moduleName: options.moduleName,
    context: options.context
  };

  files = yield glob(MODELS_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    try {
      eventData.modelName = moduleResUtil.getConstructorNameFromFile(files[i]);
      eventData.modelFullName = moduleResUtil.getConstructorNameFromFile(files[i], options.moduleName);

      beyo.emit('modelLoad', eventData);

      modelInit = beyo.appRequire(path.join(beyo.appRoot, options.path, files[i]));
      eventData.initResult = yield modelInit.call(options.context, beyo);

      if (eventData.initResult) {
        models[eventData.modelFullName] = eventData.initResult;
      }

      beyo.emit('modelLoadComplete', eventData);
    } catch (e) {
      beyo.emit('modelLoadError', e, eventData);
    }
  }

  return models;
};