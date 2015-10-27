
const PLUGINS_GLOB = '**/*.js';
const PLUGIN_EXT_PATTERN = /\.js$/;

var path = require('path');
var fs = require('fs');
var glob = require('glob');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var PluginsLoaderException = errorFactory('beyo.PluginsLoaderException', [ 'message', 'messageData' ]);

/**
Load plugins for the given path

Options
  - path                      the plugins' root path relative to beyo.rootPath
  - plugins                   an object mapping plugin names

@event pluginLoad             called before loading a plugin
@event pluginLoadError        error while loading a plugin
@event pluginLoadComplete     called after loading a plugin

@param {Beyo} beyo            the beyo module object
@param {Object} options       the loader options
*/
module.exports = pluginsLoader;


function pluginsLoader(beyo, options) {
  if (options === undefined) {
    throw PluginsLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw PluginsLoaderException('Invalid options value: ' + String(options));
  } else if (!('path' in options)) {
    throw PluginsLoaderException('Plugins path not specified');
  } else if (typeof options.path !== 'string') {
    throw PluginsLoaderException('Invalid path value: ' + String(options.path));
  }

  if ('plugins' in options) {
    if (!options.plugins || options.plugins.__proto__.constructor !== Object) {
      throw PluginsLoaderException('Invalid plugins map value: ' + String(options.plugins));
    }
  } else {
    options.plugins = {};
  }

  return new Promise(function (resolve, reject) {
    var pluginsPath = path.join(beyo.rootPath, options.path);

    fs.access(pluginsPath, fs.R_OK, function (err) {
      if (err) {
        //reject(PluginsLoaderException('Invalid plugins path', { error: err }));
        beyo.emit('pluginsNotFound', { path: pluginsPath });
        resolve({});  // no plugins
      } else {
        glob(PLUGINS_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
          if (err) {
            reject(ConfigLoaderException('Error reading configuration path', { error: err }));
          } else {
            loadPlugins(beyo, options, files).then(resolve).catch(reject);
          }
        });
      }
    });
  });
}


function loadPlugins(beyo, options, files) {
  var pluginMapList = options.plugins && Object.keys(options.plugins);

  return Promise.all(files.map(function (file) {
    return {
      pluginName: moduleResUtil.getNameFromFile(file),
      basePath: options.path,
      path: file
    };
  }).sort(function (a, b) {
    var aVal = pluginMapList && options.plugins[a.pluginName] ? pluginMapList.indexOf(a.pluginName) : null;
    var bVal = pluginMapList && options.plugins[b.pluginName] ? pluginMapList.indexOf(b.pluginName) : null;

    if (aVal !== null && bVal !== null) {
      return aVal - bVal;
    } else if (aVal !== null) {
      return -1;
    } else if (bVal !== null) {
      return 1;
    } else {
      return a.pluginName.localeCompare(b.pluginName);
    }
  }).map(function (data) {
    return loadPlugin(beyo, options, data);
  })).then(function (results) {
    var plugins = {};

    results && results.forEach(function (data) {
      if (data) {
        if (data.pluginAlias && (data.pluginAlias in plugins)) {
          data.error = PluginsLoaderException('Duplicate plugin alias: ' + String(data.pluginAlias));
          beyo.emit('pluginLoadConflict', data);

          plugins[data.pluginName] = data.initResult;
        } else if (!data.pluginAlias && (data.pluginName in plugins)) {
          data.error = PluginsLoaderException('Duplicate plugin name: ' + String(data.pluginName));
          beyo.emit('pluginLoadConflict', data);
        } else if (data && data.initResult) {
          plugins[data.pluginAlias || data.pluginName] = data.initResult;
        }
      }
    });

    beyo.emit('pluginsLoadComplete', plugins);

    return plugins;
  });
}

function loadPlugin(beyo, options, data) {
  try {

    if (data.pluginName in options.plugins) {
      if (options.plugins[data.pluginName] === false) {
        return Promise.resolve();   // skip this plugin
      } else if (!options.plugins[data.pluginName] || typeof options.plugins[data.pluginName] !== 'string') {
        throw PluginsLoaderException('Plugin map value must be a non-empty string: ' + String(options.plugins[data.pluginName]), data);
      } else if (options.plugins[data.pluginName] !== data.pluginName) {
        data.pluginAlias = options.plugins[data.pluginName];
      }
    }

    beyo.emit('pluginLoad', data);

    return Promise.resolve( require(path.join(beyo.rootPath, options.path, data.path)) ).then(function (pluginInit) {
      return pluginInit(beyo);
    }).then(function (initResult) {
      data.initResult = initResult;

      beyo.emit('pluginLoaded', data);

      return data;
    }).catch(function (e) {
      data.error = e;

      beyo.emit('pluginLoadError', data);
    });
  } catch (e) {
    data.error = e;

    beyo.emit('pluginLoadError', data);

    return Promise.resolve();
  }
}
