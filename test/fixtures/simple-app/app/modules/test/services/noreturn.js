

module.exports = function noReturnService(beyo) {
  beyo.__services = beyo.__services || {};
  this.__services = this.__services || {};

  beyo.__services['noreturn'] = true;
  this.__services['noreturn'] = true;

  return Promise.resolve();
}