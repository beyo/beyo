
const APPLICATION_NAME_REGEXP = /^[a-z]+[a-zA-Z0-9-_.]*$/;
const MODULE_NAME_REGEXP = /^[a-z]+[a-zA-Z0-9]*$/;

var crypto = require('crypto');
var co = require('co');
var errorFactory = require('error-factory');
var basename = require('path').basename;
var fileProc = require('../../lib/io/file-processor');

var BeyoInitException = errorFactory('beyo.BeyoInitException', [ 'message', 'messageData' ]);


module.exports = function init(command, actionWrapper) {
  command
    .description('Initialize a new project')
    .usage('init [options] [url|file]')
    .option('-n, --app-name <name>', 'the project name [' + basename(process.cwd()) + ']', basename(process.cwd()))
    .option('-m, --module-name <name>', 'the default module name [default]', 'default')
    .option('-p, --create-package', '(optional) create a package.json file', false)
    .option('-I, --no-npm-install', '(optional) do not run npm install', false)
    .option('-X, --no-shell-exec', '(optional) do not run shell commands', false)
    .option('-f, --fixture <git-repo>', '(optional) use fixture from git repo', false)
    .action(actionWrapper(['url|file'], null, _initAction))
  ;
};

function * _initAction(beyo, args, options) {
  var context = {
    'hash_auth_key': hash(),
    'hash_secure_auth_key': hash(),
    'hash_logged_in_key': hash(),
    'hash_nonce_in_key': hash(),
    'hash_auth_salt': hash(),
    'hash_secure_auth_salt': hash(),
    'hash_logged_in_salt': hash(),
    'hash_nonce_salt': hash(),

    'app_name': validateApplicationName(options.appName),
    'module_name': validateModuleName(options.moduleName)
  };

  console.log('[*]', 'Initialization complete!');
}

function hash() {
  return crypto.randomBytes(128).toString('base64')
}


function validateApplicationName(appName) {
  if (!APPLICATION_NAME_REGEXP.test(appName)) {
    throw BeyoInitException('Invalid application name: {{name}}', { name: appName });
  }

  return appName;
}

function validateModuleName(moduleName) {
  if (!MODULE_NAME_REGEXP.test(moduleName)) {
    throw BeyoInitException('Invalid module name: {{name}}', { name: moduleName });
  }

  return moduleName;
}
