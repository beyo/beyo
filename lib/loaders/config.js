
const CONF_GLOB = '**/*.{js,json}';
const CONF_EXT_PATTERN = /\.js(on)?$/;
const GLOBAL_MODULE_NAME = undefined;

var fs = require('co-fs');
var path = require('path');
var glob = require('co-glob');

var errorFactory = require('error-factory');

var ConfigurationException = errorFactory('beyo.ConfigurationException');


/**
Load configurations from the given path and return the merged object

Options
  - path                    the configuration path relative to beyo.appRoot
  - moduleName   (optional) the loading module name

@event configLoad            called before loading a config file.
@event configLoadError       error while loading config file
@event configLoadConflict    when a conflict is found when merging config files
@event configLoadComplete    called after loading a config files

@param {Beyo} beyo           the beyo module object
@param {Object} options      the options passed to the Beyo instance

@return {Object}             the (merged) configuration object
*/
module.exports = function * configLoader(beyo, options) {
  var config = {};
  var files;

  if (!(options && options.path)) {
    throw ConfigurationException('Config path not specified');
  }

  if (yield fs.exists(path.join(beyo.appRoot, options.path))) {

    files = yield glob(CONF_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

    files.filter(envConfigFilter(beyo)).map(function (file) {
      return path.join(options.path, file);
    }).sort().reverse().forEach(function (file, fileIndex, files) {
      var keyPathParts = path.relative(options.path, file).split(path.sep).slice(0, -1);
      var keyPath = keyPathParts.join('.');
      var confCtx = config;
      var configModule;
      var i = 0;
      var ilen = keyPathParts.length;
      var eventData = {
        basePath: options.path,
        file: file,
        fileIndex: fileIndex,
        files: files,
        config: config,
        keyPath: keyPath,
        moduleName: options.moduleName || GLOBAL_MODULE_NAME
      };

      beyo.emit('configLoad', eventData);

      try {
        configModule = beyo.appRequire(path.join(beyo.appRoot, file));

        for (; i < ilen; ++i) {
          confCtx = confCtx[keyPathParts[i]] || (confCtx[keyPathParts[i]] = {});
        }

        merge(beyo, keyPath, confCtx, configModule, eventData);

        beyo.emit('configLoadComplete', eventData);
      } catch (e) {
        beyo.emit('configLoadError', e, eventData);
      }
    });
  }

  return config;
};


function merge(beyo, keyPath, dst, src, eventData) {
  Object.keys(src).forEach(function (key) {
    var curKeyPath = (keyPath ? keyPath + '.' : '') + key;

    if (dst[key] !== null && typeof dst[key] === 'object' && typeof src[key] === 'object') {
      merge(beyo, curKeyPath, dst[key], src[key], eventData);
    } else {
      if (dst[key]) {
        beyo.emit('configLoadConflict', curKeyPath, src, dst, eventData);
      } else {
        dst[key] = src[key];
      }
    }
  });
}


function envConfigFilter(beyo) {
  var env = beyo.env || '';
  var envLen = env.length;

  return function filter(file) {
    var fileParts = file.replace(CONF_EXT_PATTERN, '').split('.');
    var i = 1;
    var ilen = fileParts.length;

    if (i >= ilen) {
      return true;    // no env string part in config file name
    } else if (env) {
      // test env only if one specified, otherwise discard all env-enabled configs
      for (; i < ilen; ++i) {
        if (env.indexOf(fileParts[i].substring(0, envLen)) === 0) {
          return true;
        }
      }
    }

    return false;
  };
}
