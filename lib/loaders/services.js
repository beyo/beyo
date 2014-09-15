
const SERVICES_GLOB = '*.js';

var glob = require('co-glob');
var path = require('path');
var errorFactory = require('error-factory');

var ServiceLoaderException = errorFactory('beyo.ServiceLoaderException', [ 'message', 'eventData' ]);

/**
Load all the module's services for the given path

Options
  - path                      the service' root path relative to beyo.appRoot
  - moduleName                the module name being loaded
  - context                   the module context to pass to the service's initialize functions

@event serviceLoad            called before loading a service
@event serviceLoadError       error while loading a service
@event serviceLoadComplete    called after loading a service

@param {Beyo} beyo            the beyo module object
@param {Object} options       the loader options
*/
module.exports = function * servicesLoader(beyo, options) {
  var services = {};
  var files;
  var serviceInit;
  var i;
  var iLen;
  var eventData;

  if (!options) {
    throw ServiceLoaderException('No options specified');
  } else if (!options.moduleName) {
    throw ServiceLoaderException('Module name not specified');
  } else if (!options.context) {
    throw ServiceLoaderException('Module context not specified');
  } else if (!options.path) {
    throw ServiceLoaderException('Services path not specified');
  }

  eventData = {
    moduleName: options.moduleName,
    context: options.context
  };

  files = yield glob(SERVICES_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    try {
      eventData.serviceName = getModelName(files[i]);

      beyo.emit('serviceLoad', eventData);

      serviceInit = beyo.appRequire(path.join(beyo.appRoot, options.path, files[i]));
      eventData.initResult = yield serviceInit.call(options.context, beyo);

      beyo.emit('serviceLoadComplete', eventData);

      if (eventData.initResult) {
        services[eventData.serviceName] = eventData.initResult;
      }
    } catch (e) {
      beyo.emit('serviceLoadError', e, eventData);
    }
  }

  return services;
};


function getModelName(file) {
  return path.basename(file, path.extname(file));
}