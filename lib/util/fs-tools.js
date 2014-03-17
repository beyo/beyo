
var fs = require('co-fs');
var suspend = require('co-suspend');
var path = require('path');
var Transform = require('stream').Transform;

var logger = require('../../').logger;

var fixturePath = path.normalize(path.join(__dirname, '/../../boilerplate'));

var TokenParser = function TokenParser() {
  Transform.apply(this, arguments);

  this.context = arguments.length && arguments[0].context || {}
};
require('util').inherits(TokenParser, Transform);
TokenParser.prototype._transform = function(chunk, encoding, done) {
  var context = this.context || {};
  done(null, chunk.replace(/%%(.+?)%%/g, function (m, t) {
    return context[t.toLocaleLowerCase()] || '';
  }));
};

module.exports.createFsStruct = createFsStruct;


function * createFsStruct(basePath, struct, context) {
  var keys = Object.keys(struct);
  var filePath;
  var file;

  logger.log('debug', 'processing path', path.relative(process.cwd(), basePath) || '.');

  for (var i = 0, len = keys.length; i < len; i++) {
    file = keys[i];
    filePath = path.join(basePath, file);

    if (typeof struct[file] === 'string') {
      yield createFile(path.join(fixturePath, struct[file]), filePath, context);
    } else {
      if (!(yield fs.exists(filePath))) {
        yield fs.mkdir(filePath);
      }
      yield createFsStruct(filePath, struct[file], context);
    }
  }
}

function * createFile(sourcePath, destPath, context) {
  var input;
  var output;
  var marker = suspend();

  logger.log('debug', 'processing file', path.relative(process.cwd(), destPath));

  if (!(yield fs.exists(sourcePath))) {
    throw new Error('Source file not found! (' + sourcePath + ')');
  }

  if (yield fs.exists(destPath)) {
    yield fs.unlink(destPath);
  }

  input = require('fs').createReadStream(sourcePath, {encoding: 'utf8'});
  output = require('fs').createWriteStream(destPath);

  input.on('close', function () {
    marker.resume();
  });

  input.pipe(new TokenParser({ decodeStrings: false, context: context })).pipe(output);

  yield marker.wait();
};
