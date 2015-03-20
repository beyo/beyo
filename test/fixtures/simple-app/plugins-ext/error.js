
module.exports = function errorPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.error = true;

  throw new Error('Error Plugin');
}
