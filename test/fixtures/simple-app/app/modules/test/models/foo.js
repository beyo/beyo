

module.exports = function fooModel(beyo) {
  beyo.__models = beyo.__models || {};
  this.__models = this.__models || {};

  beyo.__models['foo'] = true;
  this.__models['foo'] = true;

  return Promise.resolve({
    foo: 'bar'
  });
}