
const MODULE_FILE = 'index';

var path = require('path');
var errorFactory = require('error-factory');

var ApplicationException = errorFactory('beyo.ApplicationException');


module.exports = appLoader;


function appLoader(beyo, options) {
  var moduleAppInit;
  var appData;

  if (options === undefined) {
    throw ApplicationException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ApplicationException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ApplicationException('Application path not specified');
  } else if (typeof options.path !== 'string') {
    throw ApplicationException('Invalid path value: ' + String(options.path));
  }

  appData = {
    path: options.path
  };

  beyo.emit('appLoad', appData);

  return Promise.resolve( beyo.require(path.join(beyo.rootPath, options.path, MODULE_FILE)) ).then(function (moduleAppInit) {
    return moduleAppInit.call(appData, beyo);
  }).then(function (initResult) {
    appData.initResult = initResult;

    beyo.emit('appLoaded', appData);

    return initResult;
  }).catch(function (err) {
    appData.error = err;
    beyo.emit('appLoadError', appData);
    throw err;
  });
}
