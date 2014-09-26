
const PLUGINS_GLOB = '**/*.js';
const PLUGIN_EXT_PATTERN = /\.js$/;

var path = require('path');
var fs = require('co-fs');
var glob = require('co-glob');
var errorFactory = require('error-factory');

var PluginsLoaderException = errorFactory('beyo.PluginsLoaderException', [ 'message', 'eventData' ]);

/**
Load plugins for the given path

Options
  - path                      the models' root path relative to beyo.appRoot
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
  var keyPathParts;
  var pluginName;
  var pluginAlias;
  var pluginOptions;
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

  if (yield fs.exists(path.join(beyo.appRoot, options.path))) {
    files = yield glob(PLUGINS_GLOB, { cwd: path.resolve(beyo.appRoot, options.path) });

    for (i = 0, iLen = files.length; i < iLen; ++i) {
      file = path.join(options.path, files[i]);
      keyPathParts = files[i].split(path.sep).slice(0, -1);
      pluginName = keyPathParts.map(sanitizeKey).concat([getPluginName(file)]).join('.');
      pluginAlias = undefined;
      pluginOptions = {};
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

      beyo.emit('pluginLoad', eventData);

      try {

        if (pluginName in pluginsMap) {
          if ('alias' in pluginsMap[pluginName]) {
            if (!pluginsMap[pluginName].alias || typeof pluginsMap[pluginName].alias !== 'string') {
              throw PluginsLoaderException('Plugin alias must be a string: ' + String(pluginsMap[pluginName].alias), eventData);
            }

            eventData.pluginAlias = pluginAlias = pluginsMap[pluginName].alias;
          }

          if ('options' in pluginsMap[pluginName]) {
            if (!pluginsMap[pluginName].options || pluginsMap[pluginName].options.__proto__.constructor !== Object) {
              throw PluginsLoaderException('Plugin options must be an object: ' + String(options.plugins));
            }

            eventData.pluginOptions = pluginOptions = pluginsMap[pluginName].options;
          }
        }

        pluginModule = beyo.appRequire(path.join(beyo.appRoot, file));

        if (!(pluginModule instanceof Function)) {
          throw PluginsLoaderException('Plugin module does not expose function: ' + pluginModule, eventData);
        }

        if (pluginAlias in plugins) {
          pluginAlias = undefined;   // invalidate alias so we do not overwrite
        }

        if (pluginName in plugins) {
          if (!pluginAlias) {
            beyo.emit('pluginLoadConflict', eventData);
          }

          pluginName = undefined;   // invalidate name
        }

        if (pluginName || pluginAlias) {
          plugin = yield pluginModule(beyo, pluginOptions);

          if (pluginName) {
            plugins[pluginName] = plugin;
          }
          if (pluginAlias) {
            plugins[pluginAlias] = plugin;
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


function getPluginName(file) {
  return path.basename(file, path.extname(file));
}


/**
Sanitize key in config key path.
*/
function sanitizeKey(key) {
  return key.replace(/\./g, '_');
}