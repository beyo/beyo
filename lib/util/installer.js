
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


module.exports.install = install;
module.exports.createPackage = createPackage;
module.exports.installDependencies = installDependencies;


/**
Installs part of the application

Options:

  - basePath {String}               the base destination path
  - fileStruct {Object}             the file structure object
  - context {Object}                the context when parsing .beyo files
  - createPackage {Boolean}         if true, process create package
  - dependencies {Array} (optional) install the specified dependencies. If false, do not run npm install

@param options {Object}

@throw Error  on installation error
*/
function * install(options) {
  if (options.basePath && options.fileStruct) {
    yield createFsStruct(options.basePath, options.fileStruct, options.context || {});
  }

  if (options.createPackage) {
    yield createPackage();
  }

  if (options.dependencies !== false) {
    yield installDependencies(options.dependencies);
  }
}

/**
Process package.json through npm init
*/
function * createPackage() {
  if (!(yield fs.exists('package.json'))) {
    var marker = suspend();

    require('npm').load(function (err, npm) {
      if (err) {
        return marker.resume(err);
      }

      logger.log('debug', 'Generating `package.json`');

      npm.commands.init(marker.resume);
    });

    yield marker.wait();
  }
}


/**
Process module dependencies through npm install

See: https://www.npmjs.org/doc/misc/npm-config.html

@param dependencies {Array} (optional)   an array of modules to load
*/
function * installDependencies(dependencies) {
  var marker = suspend();
  var npmConfig = {
    loglevel: 'http',
    save: true
  };

  require('npm').load(npmConfig, function (err, npm) {
    if (err) {
      return marker.resume(err);
    }

    logger.log('debug', 'Installing dependencies');

    if (dependencies && dependencies.length) {
      npm.commands.install(dependencies, marker.resume);
    } else {
      npm.commands.install(marker.resume);
    }
  });

  yield marker.wait();
}


/**
Create the following file structure
*/
function * createFsStruct(basePath, struct, context) {
  var keys = Object.keys(struct);
  var filePath;
  var file;

  logger.log('debug', 'Processing path', path.relative(process.cwd(), basePath) || '.');

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

  logger.log('debug', 'Processing file', path.relative(process.cwd(), destPath));

  if (!(yield fs.exists(sourcePath))) {
    throw new Error('Source file not found! (' + sourcePath + ')');
  }

  if (yield fs.exists(destPath)) {
    yield fs.unlink(destPath);
  }

  input = require('fs').createReadStream(sourcePath, {encoding: 'utf8'});
  output = require('fs').createWriteStream(destPath);

  input.on('close', marker.resume);
  input.pipe(new TokenParser({ decodeStrings: false, context: context })).pipe(output);

  yield marker.wait();
}
