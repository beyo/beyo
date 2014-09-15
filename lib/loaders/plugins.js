
var glob = require('co-glob');
var path = require('path');
var errorFactory = require('error-factory');

var PluginsLoaderException = errorFactory('beyo.PluginsLoaderException', [ 'message', 'eventData' ]);

/**
Load plugins for the given path

Options
  - path                     the models' root path relative to beyo.appRoot
  - plugins                   an object mapping of plugins to load

@event pluginLoad             called before loading a plugin
@event pluginLoadError        error while loading a plugin
@event pluginLoadComplete     called after loading a plugin

@param {Beyo} beyo            the beyo module object
@param {Object} options       the loader options
*/
module.exports = function * pluginsLoader(beyo, options) {
  var plugins = {};
  var pluginKeys;
  var plugin;
  var i;
  var iLen;
  var eventData;

  if (!options) {
    throw PluginsLoaderException('No options specified');
  } else if (!options.plugins) {
    throw PluginsLoaderException('Unspecified plugins object');
  } else if (!options.path) {
    throw ModelLoaderException('Plugins path not specified');
  }

  eventData = {};

  pluginKeys = Object.keys(options.plugins);

  for (i = 0, iLen = pluginKeys.length; i < iLen; ++i) {
    try {
      eventData.pluginName = pluginKeys[i];
      eventData.pluginModule = options.plugins[pluginKeys[i]];

      beyo.emit('pluginLoad', eventData);

      try {
        eventData.pluginPath = path.join(beyo.appRoot, options.path, eventData.pluginModule);

        // 1. check for a local plugin
        plugin = beyo.appRequire(eventData.pluginPath);
      } catch (e) {
        delete eventData.pluginPath;

        // TODO : check e for ignore or throw

        // 2. check for an npm installed module (plugin)
        plugin = beyo.appRequire(eventData.pluginName);
      }

      eventData.initResult = yield plugin.call(options.context, beyo);

      beyo.emit('pluginLoadComplete', eventData);

      if (eventData.initResult) {
        plugins[eventData.pluginName] = eventData.initResult;
      }
    } catch (e) {
      beyo.emit('pluginLoadError', e, eventData);
    }
  }

  return plugins;
};