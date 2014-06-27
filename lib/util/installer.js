
// TODO : needs to be reviewed.... (2014-04-27)

var fs = require('co-fs');
var suspend = require('co-suspend');
var ghdownload = require('github-download');
var path = require('path');
var tmp = require('tmp');
var Transform = require('stream').Transform;
var exec = require('child_process').exec;

var logger;

var TokenParser = TokenParser;


module.exports.downloadFixture = downloadFixture;
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
  var fixturePackage;
  var def;

  if (options.basePath && options.definition) {
    fixturePackage = yield downloadFixture(options.definition);

    try {
      def = require(fixturePackage.main);
    } catch (e) {
      throw "Definition file error\n" + e.stack;
    }

    yield createFsStruct(fixturePackage.basePath, options.basePath, def.structure, options.context || {});
  }

  if (options.createPackage) {
    yield createPackage();
  }

  if (options.npmInstall) {
    yield installDependencies(def.dependencies);
  }

  if (options.shellExec) {
    yield shellExec(def.shellExec);
  }
}


function * downloadFixture(defUrl) {
  var marker = suspend();
  var tmpPath;
  var destPath;
  var fixturePackage;
  var oldTmp = process.env.TMPDIR;

  tmp.setGracefulCleanup();
  tmp.dir({ unsafeCleanup: true, template: path.join(process.cwd(), 'tmp-XXXXXXX') }, marker.resume);
  tmpPath = yield marker.wait();
  tmp.dir({ unsafeCleanup: true, template: path.join(process.cwd(), 'tmp-XXXXXXX') }, marker.resume);
  destPath = yield marker.wait();

  process.env.TMPDIR = tmpPath;

  ghdownload(defUrl, destPath)
    .on('error', marker.resume)
    .on('end', marker.resume);

  yield marker.wait();

  fixturePackage = require(path.join(destPath, 'package'));

  fixturePackage.main = path.resolve(destPath, fixturePackage.main);
  fixturePackage.basePath = path.join(destPath, 'boilerplate');

  process.env.TMPDIR = oldTmp;
  return fixturePackage;
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

      log('debug', 'Generating `package.json`');

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
  var npm;

  require('npm').load(npmConfig, marker.resume);
  npm = yield marker.wait();

  log('debug', 'Installing dependencies');

  if (dependencies && dependencies.length) {
    npm.commands.install(dependencies, marker.resume);
    yield marker.wait();
  }

  // install whatever's in package.json
  npm.commands.install(marker.resume);
  yield marker.wait();
}


function * shellExec(execCommands) {
  var marker = suspend();
  var i;
  var len;
  var command;
  var child;

  if (execCommands) {
    log('debug', 'Executing shell commands');
    for (i = 0, len = execCommands.length; i < len; ++i) {
      command = execCommands[i];

      log('debug', 'Executing : ' + command);
      // executes `pwd`
      child = exec(command, function (error, stdout, stderr) {
        if (stdout) {
          log('debug', stdout);
        }
        if (stderr) {
          log('error', stderr);
        }
        marker.resume(error);
      });

      yield marker.wait(60000);
    }
  }
}


/**
Create the following file structure
*/
function * createFsStruct(fixturePath, basePath, struct, context) {
  var keys = Object.keys(struct);
  var filePath;
  var file;

  log('debug', 'Processing path', path.relative(process.cwd(), basePath) || '.');

  for (var i = 0, len = keys.length; i < len; ++i) {
    file = keys[i];
    filePath = path.join(basePath, file);

    if (typeof struct[file] === 'string') {
      yield createFile(path.join(fixturePath, struct[file]), filePath, context);
    } else {
      if (!(yield fs.exists(filePath))) {
        yield fs.mkdir(filePath);
      }
      yield createFsStruct(fixturePath, filePath, struct[file], context);
    }
  }
}

function * createFile(sourcePath, destPath, context) {
  var input;
  var output;
  var marker = suspend();

  log('debug', 'Processing file', path.relative(process.cwd(), destPath));

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


function log() {
  if (!logger) {
    logger = require('../../').logger;
  }

  logger.log.apply(logger, arguments);
}


function TokenParser() {
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
