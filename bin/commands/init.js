
const APPLICATION_NAME_REGEXP = /^[a-z]+[a-zA-Z0-9-_.]*$/;
const MODULE_NAME_REGEXP = /^[a-z]+[a-zA-Z0-9]*$/;

var crypto = require('crypto');
var co = require('co');
var basename = require('path').basename;
var logger = require('../../').logger;
var installer = require('../../lib/util/installer');

var appStruct;
var appDependencies;


module.exports = function init(command) {
  command
    .description('Initialize a new project')
    .option('-n, --app-name <name>', 'the project name [' + basename(process.cwd()) + ']', basename(process.cwd()))
    .option('-m, --module-name <name>', 'the default module name [default]', 'default')
    .option('-P, --create-package [optional]', 'create a package.json file', false)
    .option('-I, --no-npm-install [optional]', 'do not run npm install', false)
    .option('-X, --no-shell-exec [optional]', 'do not run shell commands in def. file', false)
    .option('-s, --stub <path>', 'use stub path (file, http, etc.)', validateStubLocation)
    .action(_initAction)
  ;
};

function _initAction(args) {
  var context = {
    'hash_auth_key': hash(),
    'hash_secure_auth_key': hash(),
    'hash_logged_in_key': hash(),
    'hash_nonce_in_key': hash(),
    'hash_auth_salt': hash(),
    'hash_secure_auth_salt': hash(),
    'hash_logged_in_salt': hash(),
    'hash_nonce_salt': hash(),

    'app_name': validateApplicationName(args.appName),
    'module_name': validateModuleName(args.moduleName)
  };

  if (!args.stub) {
    throw 'No stub specified!';
  }

  this.preventStart = true;

  co(function * () {
    if (args.stub.type === 'http' || args.stub.type === 'https') {
      args.definition = yield (installer.downloadStub)(args.stub.path);
    } else {
      args.definition = args.stub.path;
    }

    yield (installer.install)({
      basePath: process.cwd(),
      definition: args.loadDef,
      context: context,
      createPackage: args.createPackage,
      npmInstall: args.npmInstall,
      shellExec: args.shellExec
    });
  })(function (err) {
    if (err) {
      logger.log('error', err);
    } else {
      logger.log('debug', 'Initialization complete!');
    }
  });
}


function validateStubLocation(value) {
  if (typeof value === 'string') {
    var matches = /^((.*?):\/\/)?(.*)$/.exec(value);

    value = {
      type: matches && matches[2] || 'file',
      path: value
    };

    if (['file', 'http', 'https'].indexOf(value.type) === -1) {
      throw new Error('Unsupported type `' + value.type + '`');
    }
  } else {
    value = false;
  }

  return value;
}

function hash() {
  return crypto.randomBytes(128).toString('base64')
}

function validateApplicationName(appName) {
  if (!APPLICATION_NAME_REGEXP.test(appName)) {
    throw new Error('Invalid application name : ' + appName);
  }

  return appName;
}

function validateModuleName(moduleName) {
  if (!MODULE_NAME_REGEXP.test(moduleName)) {
    throw new Error('Invalid module name : ' + moduleName);
  }

  return moduleName;
}
