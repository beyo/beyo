
const BEYO_MODULE_PATTERN = /^beyo-(.+)$/;

var fs = require('fs');
var glob = require('co-glob');
var koa = require('koa');
var mount = require('koa-mount');
var moduleLoader = require('./lib/module-loader');

var env = process.env.NODE_ENV || 'development';
var beyo = module.exports;
var appRoot = module.exports.appRoot = process.cwd();
var appPackage = require(appRoot + '/package');


function * loadConfig(configPath) {
  var config = module.exports.config = {};
  (yield glob('**/*.{js,json}', { cwd: configPath })).reverse().forEach(function (file) {
    var keyPath = file.split('/');
    var confCtx = config;
    var conf = require(configPath + '/' + file.replace(/\.js(on)?$/, ''));

    for (var i = 0, len = keyPath.length - 1; i < len; i++) {
      confCtx = confCtx[keyPath[i]] || (confCtx[keyPath[i]] = {});
    }

    Object.keys(conf).forEach(function (key) { confCtx[key] = conf[key]; });
  });
}

module.exports.init = function * init(module) {
  var depKeys = Object.keys(appPackage.dependencies);
  var initModule;

  yield loadConfig(appRoot + '/conf');

  for (var i = 0, len = depKeys.length; i < len; i++) {
    initModule = BEYO_MODULE_PATTERN.exec(depKeys[i]);

    if (initModule) {
      yield (require('./init/' + initModule[1]))(beyo, module.require('beyo-' + initModule[1]));
    }
  }
};

module.exports.initApplication = function * initApplication() {
  var modules = module.exports.modules = {};
  var modulePaths = module.exports.config.modulePaths;
  var moduleResult;

  for (var i = 0, iLen = modulePaths.length; i < iLen; i++) {
    var files = yield glob('*', { cwd: modulePaths[i], mark: true });
    for (var j = 0, jLen = files.length; j < jLen; j++) {
      if (files[j].substr(-1) === '/') {
        moduleResult = yield moduleLoader(beyo, appRoot + '/' + modulePaths[i] + '/' + files[j]);

        if (moduleResult !== false) {
          modules[files[j].substr(0, files[j].length - 1)] = moduleResult;
        }
      }
    }
  }
};


/**
Create a new koa instance, mount it at path and return it
*/
module.exports.createSubApp = function createSubApp(path) {
  var app = koa();

  beyo.app.use(mount(path, app));

  return app;
};


Object.defineProperty(module.exports, 'app', {
  configurable: false,
  enumerable: true,
  writable: false,
  value: koa()
});
