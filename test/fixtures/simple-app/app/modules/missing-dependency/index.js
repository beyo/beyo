

module.exports = function initMissingDependency(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['missing-dependency'] = true;
  this.__modules['missing-dependency'] = true;

  return Promise.resolve();
};