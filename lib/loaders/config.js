
const CONF_GLOB = '**/*.{js,json}';
const CONF_EXT_PATTERN = /\.js(on)?$/;
const GLOBAL_MODULE_NAME = undefined;

var path = require('path');
var fs = require('fs');
var glob = require('glob');

var errorFactory = require('error-factory');

var ConfigLoaderException = errorFactory('beyo.ConfigLoaderException');


/**
Load configurations from the given path and return the merged object

Options
  - path                    the configuration path relative to beyo.rootPath
  - moduleName   (optional) the loading module name

@event configLoad            called before loading a config file.
@event configLoadError       error while loading config file
@event configLoadConflict    when a conflict is found when merging config files
@event configLoadComplete    called after loading a config files

@param {Beyo} beyo           the beyo module object
@param {Object} options      the options passed to the Beyo instance

@return {Object}             the (merged) configuration object
*/
module.exports = function configLoader(beyo, options) {
  if (options === undefined) {
    throw ConfigLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw ConfigLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw ConfigLoaderException('Config path not specified');
  } else if (typeof options.path !== 'string') {
    throw ConfigLoaderException('Invalid path value: ' + String(options.path));
  } else if ('moduleName' in options && typeof options.moduleName !== 'string') {
    throw ConfigLoaderException('Invalid module name: ' + String(options.moduleName));
  }

  return new Promise(function (resolve, reject) {
    fs.access(path.join(beyo.rootPath, options.path), fs.R_OK, function (err) {
      if (err) {
        reject(ConfigLoaderException('Invalid configuration path', { error: err }));
      } else {
        glob(CONF_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
          if (err) {
            reject(ConfigLoaderException('Error reading configuration path', { error: err }));
          } else {
            loadConfigFiles(beyo, options, files).then(resolve).catch(reject);
          }
        });
      }
    });
  });
};


function loadConfigFiles(beyo, options, files) {
  var config = {};

  return Promise.all(files.filter(envConfigFilter(beyo)).map(function (file) {
    return path.join(options.path, file);
  }).sort().reverse().map(function (file, fileIndex, files) {
    var data = {
      basePath: options.path,
      file: file,
      fileIndex: fileIndex,
      files: files,
      config: config,
      moduleName: options.moduleName || GLOBAL_MODULE_NAME
    };

    return loadConfigFile(beyo, options, data);
  })).then(function () {

    beyo.emit('configLoadComplete', config);

    return config;
  });
}


function loadConfigFile(beyo, options, data) {
  var keyPathParts = path.relative(options.path, data.file).split(path.sep).slice(0, -1);
  var keyPath = keyPathParts.map(sanitizeKey).join('.');
  var confCtx = data.config;
  var configModule;
  var i = 0;
  var ilen = keyPathParts.length;

  data.keyPath = keyPath;

  beyo.emit('configLoad', data);

  try {
    configModule = require(path.join(beyo.rootPath, data.file));

    for (; i < ilen; ++i) {
      confCtx = confCtx[keyPathParts[i]] || (confCtx[keyPathParts[i]] = {});
    }

    merge(beyo, keyPath, confCtx, configModule, data);

    beyo.emit('configLoaded', data);
  } catch (err) {
    data.error = err;
    beyo.emit('configLoadError', data);
  }

  return Promise.resolve();
}


function merge(beyo, keyPath, dst, src, data) {
  Object.keys(src).forEach(function (key) {
    var curKeyPath = (keyPath ? keyPath + '.' : '') + key;

    if (dst[key] !== null && typeof dst[key] === 'object' && typeof src[key] === 'object') {
      merge(beyo, curKeyPath, dst[key], src[key], data);
    } else {
      if (dst[key]) {
        beyo.emit('configLoadConflict', data, { currentKeyPath: curKeyPath, configSrc: src, configDest: dst });
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
    var fileParts = path.basename(file).replace(CONF_EXT_PATTERN, '').split('.');
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

/**
Sanitize key in config key path.
*/
function sanitizeKey(key) {
  return key.replace(/\./g, '_');
}