
module.exports = function * fooPluginInit(beyo) {
  beyo.__plugins = beyo.__plugins || {};

  beyo.__plugins.foo = true;

  return function fooPlugin() {
    return true;
  };
}
