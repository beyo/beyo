
module.exports = function barPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.bar = true;

  return Promise.resolve(function barPlugin() {
    return true;
  });
}
