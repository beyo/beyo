

module.exports = function initTest(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['test-conflict'] = true;
  this.__modules['test-conflict'] = true;

  return Promise.resolve();
};