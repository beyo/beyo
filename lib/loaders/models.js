
const MODELS_GLOB = '**/*.js';

var path = require('path');
var glob = require('glob');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var ModelLoaderException = errorFactory('beyo.ModelLoaderException', [ 'message', 'messageData' ]);



/**
Load all the module's models for the given path

Options
  - path                     the models' root path relative to beyo.rootPath
  - moduleName               the module name being loaded
  - context                  the module context to pass to the model's initialize functions

@event modelLoad             called before loading a model
@event modelLoadError        error while loading a model
@event modelLoadComplete     called after loading a model

@param {Beyo} beyo           the beyo module object
@param {Object} options      the loader options
*/
module.exports = function modelsLoader(beyo, options) {
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

  return new Promise(function (resolve, reject) {
    glob(MODELS_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
      if (err) {
        reject(ModelLoaderException('Error reading models path', { error: err }));
      } else {
        loadModels(beyo, options, files).then(resolve).catch(reject);
      }
    });
  });
};


function loadModels(beyo, options, files) {
  return Promise.all(files.map(function (file) {
    return loadModel(beyo, options, file);
  })).then(function (results) {
    var models = {};

    results && results.forEach(function (data) {
      if (data && data.initResult) {
        models[data.modelFullName] = data.initResult;
      }
    });

    beyo.emit('modelsLoadComplete', models);

    return models;
  });
}


function loadModel(beyo, options, modelPath) {
  var modelData = {
    moduleName: options.moduleName,
    modelName: moduleResUtil.getNameFromFile(modelPath),
    modelFullName: moduleResUtil.getNameFromFile(modelPath, options.moduleName),
    path: modelPath,
    context: options.context
  };
  var modelInit;

  beyo.emit('modelLoad', modelData);

  try {
    return Promise.resolve( beyo.require(path.join(beyo.rootPath, options.path, modelPath)) ).then(function (modelInit) {
      return modelInit.call(modelData.context, beyo);
    }).then(function (initResult) {
      modelData.initResult = initResult;

      beyo.emit('modelLoaded', modelData);

      return modelData;
    }).catch(function (e) {
      modelData.error = e || ModelLoaderException('Model rejected');
      beyo.emit('modelLoadError', modelData);
    });
  } catch (err) {
    modelData.error = err;

    beyo.emit('modelLoadError', modelData);

    return Promise.resolve();
  }
}