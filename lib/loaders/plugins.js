
const PLUGINS_GLOB = '**/*.js';
const PLUGIN_EXT_PATTERN = /\.js$/;

var path = require('path');
var fs = require('co-fs');
var glob = require('co-glob');
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
module.exports = function * pluginsLoader(beyo, options) {
  var plugins = {};
  var files;
  var file;
  var i;
  var iLen;
  var pluginName;
  var pluginAlias;
  var pluginModule;
  var plugin;
  var eventData;

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

  if (yield fs.exists(path.join(beyo.rootPath, options.path))) {
    files = yield glob(PLUGINS_GLOB, { cwd: path.resolve(beyo.rootPath, options.path) });

    files.sort();

    for (i = 0, iLen = files.length; i < iLen; ++i) {
      file = path.join(options.path, files[i]);
      pluginName = moduleResUtil.getNameFromFile(files[i]);
      pluginAlias = undefined;
      pluginModule;
      plugin;
      eventData = {
        basePath: options.path,
        file: file,
        fileIndex: i,
        files: files,
        plugins: plugins,
        pluginName: pluginName
      };

      try {

        if (pluginName in pluginsMap) {
          if (pluginsMap[pluginName] === false) {
            continue;   // skip this plugin
          } else if (!pluginsMap[pluginName] || typeof pluginsMap[pluginName] !== 'string') {
            throw PluginsLoaderException('Plugin map value must be a non-empty string: ' + String(pluginsMap[pluginName]), eventData);
          } else if (pluginsMap[pluginName] !== pluginName) {
            eventData.pluginAlias = pluginAlias = pluginsMap[pluginName];
          }
        }

        if (pluginAlias && (pluginAlias in plugins)) {
          throw PluginsLoaderException('Duplicate plugin alias: ' + String(pluginAlias), eventData);
        }
        if (pluginName in plugins) {
          if (!pluginAlias) {
            beyo.emit('pluginLoadConflict', eventData);
          }

          pluginName = undefined;   // invalidate name
        }

        if (pluginName || pluginAlias) {
          beyo.emit('pluginLoad', eventData);

          pluginModule = beyo.require(path.join(beyo.rootPath, file));

          plugin = yield pluginModule(beyo);

          if (plugin) {
            if (pluginName) {
              plugins[pluginName] = plugin;
            }
            if (pluginAlias) {
              plugins[pluginAlias] = plugin;
            }
          }
        }

        beyo.emit('pluginLoadComplete', eventData);
      } catch (e) {
        beyo.emit('pluginLoadError', e, eventData);
      }
    }
  }

  return plugins;
};