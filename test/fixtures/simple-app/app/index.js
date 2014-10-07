
module.exports = function * appInit(beyo) {
  beyo.__app = beyo.__app || {};
  this.__app = this.__app || {};

  beyo.__app['default'] = true;
  this.__app['default'] = true;

  return "app";
}