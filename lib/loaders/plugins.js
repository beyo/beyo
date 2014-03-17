
const PLUGIN_PATH = '/plugins';


module.exports = function * pluginsLoader(beyo, plugins) {
  var ctx = {};
  var pluginBasePath = beyo.appRoot + PLUGIN_PATH;
  var pluginKeys;
  var pluginKey;
  var pluginModule;
  var plugin;

  if (plugins) {
    if (!(plugins instanceof Object)) {
      throw new Error('Bad configuration : plugins must be an object');
    }

    pluginKeys = Object.keys(plugins);

    for (var i = 0, len = pluginKeys.length; i < len; i++) {
      pluginKey = pluginKeys[i];

      if (ctx[pluginKey]) {
        throw new Error('Conflict in context while loading plugins : ' + pluginKey);
      }

      pluginModule = plugins[pluginKey].module;
      plugin = beyo.appRequire(pluginModule);

      ctx[pluginKey] = yield plugin(beyo, plugins[pluginKey].options);

      beyo.events.emit('pluginLoaded', {
        module: pluginModule,
        plugin: plugin,
        pluginValue: ctx[pluginKey]
      });
    }
  }

  return ctx;
};
