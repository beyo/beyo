
const CONF_EXT_PATTERN = /\.js(on)?$/;

var fs = require('co-fs');
var path = require('path');
var glob = require('co-glob');

/**
Load configurations from the given path and return the merged object

@param {string} configPath   the configuration path to load from (beyo.appRoot)
@param {Beyo} beyo           the beyo module object
@param {Object} options      the options passed to the Beyo instance

@return {Object}             the (merged) configuration object
*/
module.exports = function * configLoader(configPath, beyo, options) {
  var config = {};
  var files = yield glob('**/*.{js,json}', { cwd: path.join(beyo.appRoot, configPath) });

  files.filter(envConfigFilter(beyo)).reverse().forEach(function (file) {
    var keyPath = file.split(path.sep);
    var confCtx = config;
    var configFile;
    var conf;
    var i = 0;
    var ilen = keyPath.length - 1;

    configFile = path.join(path.resolve(beyo.appRoot, configPath), file.replace(/\.js(on)?$/, ''));

    if (!options.quiet) {
      console.info('[Config]', 'Loading :', path.relative(beyo.appRoot, configFile));
    }

    try {
      conf = beyo.appRequire(configFile);

      for (; i < ilen; ++i) {
        confCtx = confCtx[keyPath[i]] || (confCtx[keyPath[i]] = {});
      }

      merge(beyo, options, keyPath.slice(0, keyPath.length - 1).join('.'), confCtx, conf);
    } catch (e) {
      if (!options.quiet) {
        if (options.showStackTrace) {
          console.error('[Config]', e.stack || e);
        } else {
          console.error('[Config]', e.message || e);
        }
      }
    }
  });

  // merge with package.json. This is done after to overwrite any config declaring
  // something "reserved"
  yield loadApplicationPackageInformation(beyo);

  beyo.emit('configLoaded', {
    path: configPath,
    files: files,
    config: config
  });

  return config;
};


function merge(beyo, options, keyPath, dst, src) {
  Object.keys(src).forEach(function (key) {
    var curKeyPath = (keyPath ? keyPath + '.' : '') + key;

    if (dst[key] !== null && typeof dst[key] === 'object' && typeof src[key] === 'object') {
      merge(beyo, options, curKeyPath, dst[key], src[key]);
    } else {
      if (dst[key] && !options.quiet) {
        console.warn('[Config]', 'Conflict in config key :', curKeyPath);
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


function * loadApplicationPackageInformation(beyo) {
  var packagePath = path.join(beyo.appRoot, 'package.json');
  if (yield fs.exists(packagePath)) {
    var pkg = require(packagePath);

    beyo.config.app = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      license: pkg.license
    };
  }
}
