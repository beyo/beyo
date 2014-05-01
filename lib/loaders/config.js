
const CONF_EXT_PATTERN = /\.js(on)?$/;

var path = require('path');
var glob = require('co-glob');

/**
Load configurations from the given path and return the merged object

@param {string} configPath   the configuration path to load from (basedir)
@param {Beyo} beyo           the beyo module object

@return {Object}             the (merged) configuration object
*/
module.exports = function * configLoader(configPath, beyo) {
  var config = {};
  var files = yield glob('**/*.{js,json}', { cwd: configPath });

  files.filter(envConfigFilter(beyo)).reverse().forEach(function (file) {
    var keyPath = file.split(path.sep);
    var confCtx = config;
    var configFile;
    var conf;
    var i = 0;
    var ilen = keyPath.length - 1;

    configFile = path.join(path.resolve(process.cwd(), configPath), file.replace(/\.js(on)?$/, ''));

    beyo.logger.log('debug', '[Config] Loading :', path.relative(process.cwd(), configFile));

    conf = beyo.appRequire(configFile);

    for (; i < ilen; ++i) {
      confCtx = confCtx[keyPath[i]] || (confCtx[keyPath[i]] = {});
    }

    merge(beyo, keyPath.slice(0, keyPath.length - 1).join('.'), confCtx, conf);
  });

  beyo.events.emit('configLoaded', {
    path: configPath,
    files: files,
    config: config
  });

  return config;
};


function merge(beyo, keyPath, dst, src) {
  Object.keys(src).forEach(function (key) {
    var curKeyPath = (keyPath ? keyPath + '.' : '') + key;

    if (dst[key] !== null && typeof dst[key] === 'object' && typeof src[key] === 'object') {
      merge(beyo, curKeyPath, dst[key], src[key]);
    } else {
      if (dst[key]) {
        beyo.logger.warn('Conflict in config key :', curKeyPath);
      }
      dst[key] = src[key];
    }
  });
}


function envConfigFilter(beyo) {
  var env = beyo.env;

  return function filter(file) {
    var fileParts = file.replace(/\.js(on)?$/, '').split('.');
    var i = 1;
    var ilen = fileParts.length;

    if (i >= ilen) {
      return true;
    } else {
      for (; i < ilen; ++i) {
        if (env.indexOf(fileParts[i]) === 0) {
          return true;
        }
      }
    }

    return false;
  };
}
