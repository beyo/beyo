

module.exports = function initTestDependent(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['test-dependent'] = true;
  this.__modules['test-dependent'] = true;

  return Promise.resolve();
};