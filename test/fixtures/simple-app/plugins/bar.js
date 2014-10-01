
module.exports = function * barPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.bar = true;

  return function barPlugin() {
    return true;
  };
}
