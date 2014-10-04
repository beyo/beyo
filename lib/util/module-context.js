
var errorFactory = require('error-factory');

var objectUtil = require('./object');
var resources = require('./resources');

var ModuleContextException = errorFactory('beyo.ModuleContextException', [ 'message', 'messageData' ]);


module.exports = createModuleContext;


/**
Create a module context
*/
function createModuleContext(module, config) {
  var context = new ModuleContext();

  if (arguments.length === 0) {
    throw ModuleContextException('No module specified');
  } else if (!module || module.constructor !== Object) {
    throw ModuleContextException('Invalid module argument');
  } else if (!('name' in module)) {
    throw ModuleContextException('Module has no name');
  } else if ((typeof module.name !== 'string') || !resources.isModuleNameValid(module.name)) {
    throw ModuleContextException('Invalid module name: {{moduleName}}', { moduleName: module.name });
  }

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
      value: config || {}
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