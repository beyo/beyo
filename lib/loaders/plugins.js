
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
