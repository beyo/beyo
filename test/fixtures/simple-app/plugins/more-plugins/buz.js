
module.exports = function * buzPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.buz = true;

  return function buzPlugin() {
    return true;
  };
}
