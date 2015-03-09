
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
  var pluginMap;

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

    pluginsMap = options.plugins;

  } else {
    pluginsMap = {};
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
            resolve(loadPluginFiles(beyo, options, files, pluginsMap));
          }
        });
      }
    });
  });
}


function loadPluginFiles(beyo, options, files, pluginsMap) {
  var pluginLoaders = [];
  var plugins = {};
  var file;
  var i;
  var iLen;
  var pluginModule;
  var eventData;

  files.sort();

  for (i = 0, iLen = files.length; i < iLen; ++i) {
    file = path.join(options.path, files[i]);
    pluginModule;
    eventData = {
      basePath: options.path,
      file: file,
      fileIndex: i,
      files: files,
      plugins: plugins,
      pluginName: moduleResUtil.getNameFromFile(files[i])
    };

    if (eventData.pluginName in pluginsMap) {
      if (pluginsMap[eventData.pluginName] === false) {
        continue;   // skip this plugin
      } else if (!pluginsMap[eventData.pluginName] || typeof pluginsMap[pluginName] !== 'string') {
        throw PluginsLoaderException('Plugin map value must be a non-empty string: ' + String(pluginsMap[pluginName]), eventData);
      } else if (pluginsMap[eventData.pluginName] !== eventData.pluginName) {
        eventData.pluginAlias = pluginsMap[eventData.pluginName];
      }
    }

    if (eventData.pluginAlias && (eventData.pluginAlias in plugins)) {
      throw PluginsLoaderException('Duplicate plugin alias: ' + String(eventData.pluginAlias), eventData);
    }
    if (eventData.pluginName in plugins) {
      if (!eventData.pluginAlias) {
        beyo.emit('pluginLoadConflict', eventData);
      }

      eventData.pluginName = undefined;   // invalidate name
    }

    if (eventData.pluginName || eventData.pluginAlias) {
      beyo.emit('pluginLoad', eventData);

      try {
        pluginModule = beyo.require(path.join(beyo.rootPath, file));

        pluginLoaders.push(loadPlugin(beyo, plugins, eventData, pluginModule));
      } catch (err) {
        beyo.emit('pluginLoadError', err, eventData);
      }
    }
  }

  return Promise.all(pluginLoaders).then(function () {
    return Promise.resolve(plugins);
  });
}


function loadPlugin(beyo, plugins, eventData, pluginModule) {
  return pluginModule(beyo).then(function (plugin) {
    if (plugin) {
      if (eventData.pluginName) {
        plugins[eventData.pluginName] = plugin;
      }
      if (eventData.pluginAlias) {
        plugins[eventData.pluginAlias] = plugin;
      }
    }

    beyo.emit('pluginLoadComplete', eventData);
  }).catch(function (err) {
    beyo.emit('pluginLoadError', err, eventData);
  });
}