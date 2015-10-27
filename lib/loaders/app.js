
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

  return Promise.resolve( require(path.join(beyo.rootPath, options.path, MODULE_FILE)) ).then(function (Application) {
    var app = appData.app = new Application(beyo);

    return beyo.emit('appLoaded', appData).then(function () {
      return app;
    });
  }).catch(function (err) {
    appData.error = err;
    beyo.emit('appLoadError', appData);
    throw err;
  });
}
