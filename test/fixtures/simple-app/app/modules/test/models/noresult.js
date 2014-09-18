

module.exports = function * fooModel(beyo) {
  beyo.__models = beyo.__models || {};
  this.__models = this.__models || {};

  beyo.__models['noresult'] = true;
  this.__models['noresult'] = true;

}