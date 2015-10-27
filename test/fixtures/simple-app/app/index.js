
module.exports = function Application(beyo) {
  beyo.__app = beyo.__app || {};
  this.__app = this.__app || {};

  beyo.__app['default'] = true;
  this.__app['default'] = true;
};