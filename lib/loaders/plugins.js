
const PLUGIN_PATH = '/plugins';

var path = require('path');


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
      throw new Error('Bad configuration : plugins must be an object');
    }

    pluginKeys = Object.keys(plugins);

    for (var i = 0, len = pluginKeys.length; i < len; i++) {
      pluginKey = pluginKeys[i];

      if (ctx[pluginKey]) {
        throw new Error('Conflict in context while loading plugins : ' + pluginKey);
      }

      pluginModule = path.resolve(process.cwd(), plugins[pluginKey].module);

      beyo.logger.log('debug', 'Loading plugin :', path.relative(process.cwd(), pluginModule));

      plugin = beyo.appRequire(pluginModule);

      pluginValue = yield plugin(beyo, plugins[pluginKey].options);

      if (pluginValue) {
        ctx[pluginKey] = pluginValue;
      }

      beyo.events.emit('pluginLoaded', {
        module: pluginModule,
        plugin: plugin,
        pluginValue: pluginValue
      });
    }
  }

  return ctx;
};
