
const TOKEN_PATTERN = /%([a-z][a-z0-9_]*)/ig;
const NEWLINE = /\r?\n/;

var path = require('path');
var Transform = require('stream').Transform;
var util = require('util');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs-extra');
var suspend = require('co-suspend');
var errorFactory = require('error-factory');

var FileProcessorException = errorFactory('beyo.FileProcessorException', [ 'message', 'messageData' ]);


/**
Expose API
*/
module.exports.createFiles = createFiles;
module.exports.formatText = formatText;
module.exports.isChildPath = isChildPath;



function TextFormatTransformer(options) {
  if (!(this instanceof TextFormatTransformer))
    return new TextFormatTransformer(options);

  Transform.call(this, options);
  this._writableState.objectMode = false;
  this._readableState.objectMode = true;
  this._buffer = '';
  this._decoder = new StringDecoder('utf8');
  this._tokens = options.tokens;  // tokens has been set already!
}
util.inherits(TextFormatTransformer, Transform);


TextFormatTransformer.prototype._transform = function (chunk, encoding, cb) {
  var lines;
  var i;
  var iLen;

  this._buffer += this._decoder.write(chunk);
  // split on newlines

  lines = this._buffer.split(NEWLINE);

  // keep the last partial line buffered
  this._buffer = lines.pop();

  for (i = 0, iLen = lines.length; i < iLen; ++i) {
    this.push(formatText(lines[i], this._tokens));
  }

  cb();
};

TextFormatTransformer.prototype._flush = function (cb) {
  if (this._buffer.length) {
    this.push(formatText(this._buffer, this._tokens));
  }
  cb();
};




/**
Create some files inside a given path

Options

   - path {String}       the files base path
   - files {Object}      the files structure
   - tokens {Object}     the replacement tokens

@param {Object} beyo
@param {Object} options
*/
function * createFiles(beyo, options) {
  var marker = suspend();
  var basePath;
  var files;
  var file;
  var filePath;
  var content;
  var eventData;
  var i;
  var iLen;
  var reader;
  var writer;

  if (options === undefined) {
    throw FileProcessorException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw FileProcessorException('Invalid options value: {{options}}', { options: options });
  } else if (!('path' in options)) {
    throw FileProcessorException('Path not specified');
  } else if (typeof options.path !== 'string') {
    throw FileProcessorException('Invalid path value: {{path}}', { path: options.path });
  } else if (!('files' in options)) {
    throw FileProcessorException('Files not specified');
  } else if (!options.files || options.files.__proto__.constructor !== Object) {
    throw FileProcessorException('Invalid files value: {{files}}', { files: options.files });
  } else if ('resourcePath' in options && (!options.resourcePath || typeof options.resourcePath !== 'string')) {
    throw FileProcessorException('Invalid resource path value: {{path}}', { path: options.resourcePath });
  } else if ('tokens' in options && (!options.tokens || options.tokens.__proto__.constructor !== Object)) {
    throw FileProcessorException('Invalid tokens value: {{tokens}}', { tokens: options.tokens });
  }

  // ensure we can check for tokens safely
  options.tokens = options.tokens || {};
  basePath = path.join(beyo.rootPath, options.path);

  files = Object.keys(options.files);

  // first pass, testing values
  for (i = 0, iLen = files.length; i < iLen; ++i) {
    file = files[i];
    filePath = path.join(basePath, path.dirname(file));
    content = options.files[file];

    if (!isChildPath(basePath, filePath)) {
      throw FileProcessorException('Invalid path: {{path}}', { path: file, basePath: filePath });
    } else if ((content.charAt(0) === '@') && !options.resourcePath) {
      throw FileProcessorException('Resource path not specified: {{file}}', { file: content.substring(1) });
    }
  }

  // second pass, create structure
  for (i = 0, iLen = files.length; i < iLen; ++i) {
    try {
      file = files[i];
      filePath = path.join(basePath, path.dirname(file));
      content = options.files[file];
      eventData = {
        file: file,
        fileIndex: i,
        files: files,
        options: options
      };

      // full path
      file = path.join(basePath, file);

      fs.ensureDir(filePath, marker.resume);
      yield marker.wait();

      if (content.charAt(0) === '@') {
        content = path.join(options.resourcePath, content.substring(1));

        writer = fs.createWriteStream(file, { flags: 'w' })
          .on('error', marker.resume)
          .on('close', marker.resume);

        reader = fs.createReadStream(content, { encoding: 'UTF-8' })
          .on('error', marker.resume)
          .pipe(TextFormatTransformer({ tokens: options.tokens }))
          .pipe(writer);

        yield marker.wait();
      } else {
        fs.writeFile(file, formatText(content, options.tokens), marker.resume);
        yield marker.wait();
      }

      beyo.emit('installFileComplete', eventData)
    } catch (err) {
      beyo.emit('installFileError', err, eventData);
    }
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



