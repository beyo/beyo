
const PLUGINS_GLOB = '**/*.js';
const PLUGIN_EXT_PATTERN = /\.js$/;

var path = require('path');
var fs = require('fs');
var glob = require('glob');
var errorFactory = require('error-factory');

var moduleResUtil = require('../util/resources');

var PluginsLoaderException = errorFactory('beyo.PluginsLoaderException', [ 'message', 'eventData' ]);

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
    fs.access(path.join(beyo.rootPath, options.path), fs.R_OK, function (err) {
      if (err) {
        reject(PluginsLoaderException('Invalid plugins path', { error: err }));
      } else {
        glob(PLUGINS_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) }, function (err, files) {
          if (err) {
            reject(ConfigLoaderException('Error reading configuration path', { error: err }));
          } else {
            loadPlugins(beyo, options, files).then(resolve);
          }
        });
      }
    });
  });
}


function loadPlugins(beyo, options, files) {
  return Promise.all(files.sort().map(function (file) {
    return loadPlugin(beyo, options, file);
  })).then(function (results) {
    var plugins = {};

    results && results.forEach(function (data) {
      if (data.pluginAlias && (data.pluginAlias in plugins)) {
        beyo.emit('pluginLoadConflict', PluginsLoaderException('Duplicate plugin aliases: ' + String(data.pluginAlias)), data);
      } else if (!data.pluginAlias && (data.pluginName in plugins)) {
        beyo.emit('pluginLoadConflict', PluginsLoaderException('Duplicate plugin names: ' + String(data.pluginName)), data);
      } else if (data && data.initResult) {
        plugins[data.pluginAlias || data.pluginName] = data.initResult;
      }
    });

    return plugins;
  });
}

function loadPlugin(beyo, options, pluginPath) {
  var eventData = {
    pluginName: moduleResUtil.getNameFromFile(pluginPath),
    basePath: options.path,
    path: pluginPath
  };
  var pluginInit;

  if (eventData.pluginName in options.plugins) {
    if (options.plugins[eventData.pluginName] === false) {
      return Promise.resolve();   // skip this plugin
    } else if (!options.plugins[eventData.pluginName] || typeof options.plugins[pluginName] !== 'string') {
      throw PluginsLoaderException('Plugin map value must be a non-empty string: ' + String(pluginsMap[pluginName]), eventData);
    } else if (options.plugins[eventData.pluginName] !== eventData.pluginName) {
      eventData.pluginAlias = options.plugins[eventData.pluginName];
    }
  }

  beyo.emit('pluginLoad', eventData);

  try {
    pluginInit = beyo.require(path.join(beyo.rootPath, options.path, pluginPath));

    return pluginInit(beyo).then(function (initResult) {
      eventData.initResult = initResult;

      beyo.emit('pluginLoadComplete', eventData);

      return eventData;
    }).catch(function (e) {
      beyo.emit('pluginLoadError', e, eventData);
    });
  } catch (e) {
    beyo.emit('pluginLoadError', e, eventData);

    return Promise.resolve();
  }
}
