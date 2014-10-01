
const SERVICES_GLOB = '*.js';

var glob = require('co-glob');
var path = require('path');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

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

  if (options === undefined) {
    throw ServiceLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ServiceLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ServiceLoaderException('Controllers path not specified');
  } else if (typeof options.path !== 'string') {
    throw ServiceLoaderException('Invalid path value: ' + String(options.path));
  } else if (!('moduleName' in options)) {
    throw ServiceLoaderException('Module name not specified');
  } else if (typeof options.moduleName !== 'string') {
    throw ServiceLoaderException('Invalid module name: ' + String(options.moduleName));
  } else if (!('context' in options)) {
    throw ServiceLoaderException('Module context not specified');
  } else if (!options.context || options.context.__proto__.constructor.name !== 'ModuleContext') {
    throw ServiceLoaderException('Invalid module context: ' + String(options.context));
  }

  eventData = {
    moduleName: options.moduleName,
    context: options.context
  };

  files = yield glob(SERVICES_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    try {
      eventData.serviceName = moduleResUtil.getNameFromFile(files[i]);
      eventData.serviceFullName = moduleResUtil.getNameFromFile(files[i], options.moduleName);

      beyo.emit('serviceLoad', eventData);

      serviceInit = beyo.appRequire(path.join(beyo.appRoot, options.path, files[i]));
      eventData.initResult = yield serviceInit.call(options.context, beyo);

      if (eventData.initResult) {
        services[eventData.serviceFullName] = eventData.initResult;
      }

      beyo.emit('serviceLoadComplete', eventData);
    } catch (e) {
      beyo.emit('serviceLoadError', e, eventData);
    }
  }

  return services;
};