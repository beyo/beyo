
const MODULE_NAME_REGEX = /^[a-z](-?[a-z0-9]+)*$/i;
const RESOURCE_NAME_REGEX = /^_*[a-z](_?[a-z0-9]*)*$/i;

const MODULE_SEP = '/';
const RESOURCE_SEP = '.';

var path = require('path');
var camelCase = require('camel-case');
var pascalCase = require('pascal-case');
var varValidator = require('var-validator');

var errorFactory = require('error-factory');

var ResourceException = errorFactory('beyo.ResourceException', [ 'message', 'messageData' ]);


module.exports.MODULE_SEP = MODULE_SEP;
module.exports.RESOURCE_SEP = RESOURCE_SEP;


module.exports.isModuleNameValid = isModuleNameValid;
module.exports.isNameValid = isNameValid;
module.exports.getNameFromFile = getNameFromFile;


/**
Validate the module name
*/
function isModuleNameValid(moduleName) {
  if (!moduleName || typeof moduleName !== 'string') {
    return false;
  }

  return MODULE_NAME_REGEX.test(moduleName);
}


/**
Check that the given resource name if valid. The resource name may be a name
or constructor name.

@param name {String}
@return {Boolean}
*/
function isNameValid(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  return RESOURCE_NAME_REGEX.test(name);
}

/**
Return the resource name for the given file.

For example

   getNameFromFile('./foo/bar/buz.js', 'my-module');
   // 'my-module/foo.bar.buz'
   getNameFromFile('./foo/bar/buz.js');
   // 'foo.bar.buz'

@param file {String}
@param moduleName {String}    (optional) the module name
@return {String}              the resource name
*/
function getNameFromFile(file, moduleName) {
  var name;
  var pkg;

  if (moduleName !== undefined && !isModuleNameValid(moduleName)) {
    throw ResourceException('Invalid argument `moduleName`: {{moduleName}}', { moduleName: moduleName });
  } else if (file === undefined || typeof file !== 'string') {
    throw ResourceException('Invalid argument `file`: {{file}}', { file: file, moduleName: moduleName });
  }

  pkg = path.join(path.dirname(file), path.basename(file, path.extname(file))).split(path.sep).map(camelCase).filter(isNameValid);

  if (!pkg.length || !pkg.every(varValidator.isValid)) {
    throw ResourceException('Invalid name: {{name}}', { name: pkg.join(RESOURCE_SEP), moduleName: moduleName, file: file });
  }

  name = pkg.join(RESOURCE_SEP);

  if (moduleName) {
    name = moduleName + MODULE_SEP + name;
  }

  return name;
}