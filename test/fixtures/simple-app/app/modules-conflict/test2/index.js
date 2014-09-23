

module.exports = function * initDefault(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['test2'] = true;
  this.__modules['test2'] = true;
};