
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
    } catch (e) {
      beyo.emit('pluginLoadError', e, eventData);
    }
  }

};


/*
const PLUGIN_PATH = '/plugins';

var path = require('path');
var fs = require('co-fs');
var errorFactory = require('error-factory');

var PluginLoaderException = errorFactory('beyo.PluginLoaderException', [ 'message', 'messageData' ]);


module.exports = function * pluginsLoader(beyo, plugins) {
  var ctx = {};
  var pluginBasePath = beyo.appRoot + PLUGIN_PATH;
  var pluginKeys;
  var pluginKey;
  var pluginModule;
  var pluginValue;
  var plugin;

  if (plugins) {
    if (!(plugins instanceof Object)) {
      throw PluginLoaderException('Bad configuration : plugins must be an object');
    }

    pluginKeys = Object.keys(plugins);

    for (var i = 0, len = pluginKeys.length; i < len; i++) {
      pluginKey = pluginKeys[i];

      if (ctx[pluginKey]) {
        throw PluginLoaderException('Conflict in context while loading plugins : {{key}}', { key : pluginKey });
      }

      try {
        pluginModule = plugins[pluginKey].module;

        plugin = beyo.appRequire(pluginModule);
      } catch (e) {
        pluginModule = path.resolve(process.cwd(), plugins[pluginKey].module);

        plugin = beyo.appRequire(pluginModule);

        pluginModule = path.relative(process.cwd(), pluginModule);
      }

      beyo.logger.log('debug', '[Plugin] Loading :', pluginModule);


      pluginValue = yield plugin(beyo, plugins[pluginKey].options);

      if (pluginValue) {
        ctx[pluginKey] = pluginValue;
      }

      beyo.emit('pluginLoaded', {
        module: pluginModule,
        plugin: plugin,
        pluginValue: pluginValue
      });
    }
  }

  beyo.emit('pluginsLoadComplete', {
    context: ctx
  });

  return ctx;
};
*/