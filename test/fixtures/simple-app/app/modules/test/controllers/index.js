

module.exports = function * indexController(beyo) {
  beyo.__controllers = beyo.__controllers || {};
  this.__controllers = this.__controllers || {};

  beyo.__controllers['index'] = true;
  this.__controllers['index'] = true;

  return 'index';
}