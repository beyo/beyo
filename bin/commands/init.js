
var crypto = require('crypto');
var co = require('co');
var fsTools = require('../../lib/util/fs-tools');
var basename = require('path').basename;

var appStruct = {
  'app': {
    'index.js': 'app/loader.js.beyo',
    'modules': {
      'demo': {
        'conf': {},
        'controllers': {},
        'models': {},
        'views': {},
        'index.js': 'module/loader.js.beyo'
      }
    }
  },
  'conf': {
    'index.json': 'conf/app.json.beyo'
  },
  'layouts': {},
  'pub': {
    'css': {},
    'js': {},
    'img': {}
  }
};


module.exports = function init(command) {
  command
    .description('Initialize a new project')
    .option('-n, --app-name <name>', 'The project name [' + basename(process.cwd()) + ']', basename(process.cwd()))
    .option('-m, --module-name <name>', 'The default module name [default]', 'default')
    .action(_initAction)
  ;
};

function hash() {
  return crypto.randomBytes(128).toString('base64')
}

function _initAction(args) {
  var basePath = process.cwd();
  var context = {
    'hash_auth_key': hash(),
    'hash_secure_auth_key': hash(),
    'hash_logged_in_key': hash(),
    'hash_nonce_in_key': hash(),
    'hash_auth_salt': hash(),
    'hash_secure_auth_salt': hash(),
    'hash_logged_in_salt': hash(),
    'hash_nonce_salt': hash(),

    'app_name': args.appName,
    'module_name': args.moduleName
  };

  co(function * () {
    yield fsTools.createFsStruct(basePath, appStruct, context);
    yield createPackage();
  })(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Done!");
    }
  });
}


function * createPackage() {


}
