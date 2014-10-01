
module.exports = function * emptyPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.empty = true;


  // NOTE : does not return anything
}
