

module.exports = function initTest(beyo) {
  beyo.__modules = beyo.__modules || {};
  this.__modules = this.__modules || {};

  beyo.__modules['test'] = true;
  this.__modules['test'] = true;

  return Promise.resolve();
};