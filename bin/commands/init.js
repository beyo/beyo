
const APPLICATION_NAME_REGEXP = /^[a-z]+[a-zA-Z0-9-_.]*$/;
const MODULE_NAME_REGEXP = /^[a-z]+[a-zA-Z0-9]*$/;

var crypto = require('crypto');
var co = require('co');
var basename = require('path').basename;
var logger = require('../../').logger;
var install = require('../../lib/util/installer').install;

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
    .option('-d, --load-def <name>', 'use definition file [default]', 'default')
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

  this.preventStart = true;

  co(function * () {
    yield install({
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
