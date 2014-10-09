
const TOKEN_PATTERN = /%([a-z]\w*)/ig;

var path = require('path');
var fs = require('fs-extra');
var errorFactory = require('error-factory');

var FileProcessorException = errorFactory('beyo.FileProcessorException', [ 'message', 'messageData' ]);


/**
Expose API
*/
module.exports.createFiles = createFiles;
module.exports.formatText = formatText;
module.exports.isChildPath = isChildPath;


/**
Create some files inside a given path

@param {Object} beyo
@param {Object} options
*/
function * createFiles(beyo, options) {
  var files;
  var file;
  var filePath;
  var i;
  var iLen;

  if (options === undefined) {
    throw FileProcessorException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw FileProcessorException('Invalid options value: {{options}}', { options: options });
  } else if (!('path' in options)) {
    throw FileProcessorException('Path not specified');
  } else if (typeof options.path !== 'string') {
    throw FileProcessorException('Invalid path value: {{path}}', { path: options.path });
  } else if (!('fileDirectives' in options)) {
    throw FileProcessorException('File directives not specified');
  } else if (!options.fileDirectives || options.fileDirectives.__proto__.constructor !== Object) {
    throw FileProcessorException('Invalid file directives value: {{fileDirectives}}', { fileDirectives: options.fileDirectives });
  } else if ('tokens' in options && (!options.tokens || options.tokens.__proto__.constructor !== Object)) {
    throw FileProcessorException('Invalid tokens value: {{tokens}}', { tokens: options.tokens });
  }

  // ensure we can check for tokens safely
  options.tokens = options.tokens || {};

  files = Object.keys(options.fileDirectives);

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    file = files[i];
    filePath = path.basename(file);


  }

}


/**
Change all %token into the value inside tokens[token] and return it

@param {String} str
@param {Object} tokens
@return {String}
*/
function formatText(str, tokens) {
  return str.replace(TOKEN_PATTERN, function (m, token) {
    if (token in tokens) {
      return tokens[token];
    } else {
      return m;
    }
  });
}


/**
Returns true if and only if childPath is a descendant (children)
of parentPath.

@param {String} parentPath     the parent path
@param {String} childPat       the child path
@return {Boolean}
*/
function isChildPath(parentPath, childPath) {
  var relPath = path.resolve(parentPath, childPath);

  return relPath.indexOf(parentPath) === 0;
}