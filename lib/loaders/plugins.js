
const PLUGIN_PATH = '/plugins';


module.exports = function * pluginsLoader(beyo, config) {
  var ctx = {};
  var pluginBasePath = beyo.appRoot + PLUGIN_PATH;
  var plugins = config && config.plugins;
  var pluginKeys;
  var pluginKey;
  var pluginPath;
  var plugin;

  if (plugins) {
    if (!(plugins instanceof Object)) {
      throw new Error('Bad configuration : plugin must be an array');
    }

    pluginKeys = Object.keys(plugins);

    for (var i = 0, len = pluginKeys.length; i < len; i++) {
      pluginKey = pluginKeys[i];

      if (ctx[pluginKey]) {
        throw new Error('Conflict in context while loading plugins : ' + pluginKey);
      }

      pluginPath = pluginBasePath + '/' + pluginKeys[i].replace('.', '/');
      plugin = require(pluginPath);

      ctx[pluginKey] = yield plugin(beyo, plugins[pluginKey]);

      beyo.events.emit('pluginLoaded', {
        path: pluginPath,
        plugin: plugin,
        pluginValue: ctx[pluginKey]
      });
    }
  }

  return ctx;
};
