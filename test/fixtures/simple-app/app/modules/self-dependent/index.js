

module.exports = function initSelfDependent(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['self-dependent'] = true;
  this.__modules['self-dependent'] = true;

  return Promise.resolve();
};