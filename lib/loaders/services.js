
const SERVICES_GLOB = '*.js';

var glob = require('glob');
var path = require('path');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var ServiceLoaderException = errorFactory('beyo.ServiceLoaderException', [ 'message', 'messageData' ]);

/**
Load all the module's services for the given path

Options
  - path                      the service' root path relative to beyo.rootPath
  - moduleName                the module name being loaded
  - context                   the module context to pass to the service's initialize functions

@event serviceLoad            called before loading a service
@event serviceLoadError       error while loading a service
@event serviceLoadComplete    called after loading a service

@param {Beyo} beyo            the beyo module object
@param {Object} options       the loader options
*/
module.exports = function servicesLoader(beyo, options) {
  if (options === undefined) {
    throw ServiceLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ServiceLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ServiceLoaderException('Services path not specified');
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

  return new Promise(function (resolve, reject) {
    glob(SERVICES_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
      if (err) {
        reject(ServiceLoaderException('Error reading services path', { error: err }));
      } else {
        loadServices(beyo, options, files).then(resolve).catch(reject);
      }
    });
  });
}


function loadServices(beyo, options, files) {
  return Promise.all(files.map(function (file) {
    return loadService(beyo, options, file);
  })).then(function (results) {
    var services = {};

    results && results.forEach(function (data) {
      if (data && data.initResult) {
        services[data.serviceFullName] = data.initResult;
      }
    });

    return services;
  });
}


function loadService(beyo, options, servicePath) {
  var serviceData = {
    moduleName: options.moduleName,
    serviceName: moduleResUtil.getNameFromFile(servicePath),
    serviceFullName: moduleResUtil.getNameFromFile(servicePath, options.moduleName),
    path: servicePath,
    context: options.context
  };
  var serviceInit;

  beyo.emit('serviceLoad', serviceData);

  try {
    serviceInit = beyo.require(path.join(beyo.rootPath, options.path, servicePath));

    return serviceInit.call(options.context, beyo).then(function (initResult) {
      serviceData.initResult = initResult;

      beyo.emit('serviceLoaded', serviceData);

      return serviceData;
    }).catch(function (err) {
      serviceData.error = err;
      beyo.emit('serviceLoadError', serviceData);
    });
  } catch (err) {
    serviceData.error = err;
    beyo.emit('serviceLoadError', serviceData);

    return Promise.resolve();
  }
}