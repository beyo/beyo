

module.exports = function * initTestInvalidName(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['test-invalid-name'] = true;
  this.__modules['test-invalid-name'] = true;
};