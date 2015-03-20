
module.exports = function rejectPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.reject = true;

  return Promise.reject();
}
