
const MODULE_NAME_REGEX = /^[a-z][a-z0-9-]*$/i;

const MODULE_SEP = '/';
const RESOURCE_SEP = '.';

var path = require('path');
var camelCase = require('camel-case');
var pascalCase = require('pascal-case');

var errorFactory = require('error-factory');

var ResourceException = errorFactory('beyo.ResourceException', [ 'message', 'messageData' ]);


module.exports.MODULE_SEP = MODULE_SEP;
module.exports.RESOURCE_SEP = RESOURCE_SEP;


module.exports.isModuleNameValid = isModuleNameValid;
module.exports.isNameValid = isNameValid;
module.exports.getConstructorNameFromFile = getConstructorNameFromFile;
module.exports.getNameFromFile = getNameFromFile;


/**
Validate the module name
*/
function isModuleNameValid(moduleName) {
  return MODULE_NAME_REGEX.test(moduleName);
}


/**
Check that the given resource name if valid. The resource name may be a name
or constructor name.

@param name {String}
@return {Boolean}
*/
function isNameValid(name) {
  throw ResourceException('Not implemented: isNameValid');
}

/**
Return the resource constructor name for the given file.

For example

   getNameFromFile('./foo/bar/buz.js', 'my-module');
   // 'my-mModule/foo.bar.Buz'
   getNameFromFile('./foo/bar/buz.js');
   // 'foo.bar.Buz'

@param file {String}
@param moduleName {String}    (optional) the module name
@return {String}              the resource name
*/
function getConstructorNameFromFile(file, moduleName) {
  var name;
  var pkg;

  if (moduleName !== undefined && typeof moduleName !== 'string') {
    throw ResourceException('Invalid argument `moduleName`: {{moduleName}}', { moduleName: moduleName });
  } else if (moduleName === '') {
    throw ResourceException('Empty module name given');
  }

  pkg = path.dirname(file).split(path.sep).map(camelCase).filter(filterOutEmpty);
  pkg.push(pascalCase(path.basename(file, path.extname(file))));

  name = pkg.join(RESOURCE_SEP);

  if (moduleName) {
    name = moduleName + MODULE_SEP + name;
  }

  return name;
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

  if (moduleName !== undefined && typeof moduleName !== 'string') {
    throw ResourceException('Invalid argument `moduleName`: {{moduleName}}', { moduleName: moduleName });
  } else if (moduleName === '') {
    throw ResourceException('Empty module name given');
  }

  name = path.join(path.dirname(file), path.basename(file, path.extname(file))).split(path.sep).map(camelCase).filter(filterOutEmpty).join(RESOURCE_SEP);

  if (moduleName) {
    name = moduleName + MODULE_SEP + name;
  }

  return name;
}


function filterOutEmpty(v) {
  return v;
}