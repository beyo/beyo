
const MODULE_FILE = 'index';

var path = require('path');
var errorFactory = require('error-factory');

var ApplicationException = errorFactory('beyo.ApplicationException');


module.exports = appLoader;


function * appLoader(beyo, options) {
  var moduleAppInit;
  var eventData;

  if (options === undefined) {
    throw ApplicationException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ApplicationException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ApplicationException('Application path not specified');
  } else if (typeof options.path !== 'string') {
    throw ApplicationException('Invalid path value: ' + String(options.path));
  }

  eventData = {
    appPath: options.path
  };

  try {
    beyo.emit('appLoad', eventData);

    moduleAppInit = beyo.require(path.join(beyo.rootPath, options.path, MODULE_FILE));

    eventData.initResult = yield moduleAppInit.call(eventData, beyo);

    beyo.emit('appLoadComplete', eventData);
  } catch (e) {
    beyo.emit('appLoadError', e, eventData);
  }

  return eventData.initResult;
}
