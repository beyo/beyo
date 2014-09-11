
var objectUtil = require('./object');


module.exports = createModuleContext;


/**
Create a module context
*/
function createModuleContext(module, config) {
  var context = new ModuleContext();

  Object.defineProperties(context, {
    '_module': {
      configurable: false,
      enumerable: false,
      writable: false,
      value: module
    },
    '_config': {
      configurable: false,
      enumerable: false,
      writable: false,
      value: config
    },
    'config': {
      configurable: false,
      enumerable: true,
      writable: false,
      value: readConfigValue
    }
  });

  return context;
}


/**
Module context constructor
*/
function ModuleContext() {}


/**
Return a configuration value from the specified path
*/
function readConfigValue(path, defValue) {
  return objectUtil.getValue(this._config, path, defValue);
}