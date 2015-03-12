

module.exports = function errorService(beyo) {
  beyo.__services = beyo.__services || {};
  this.__services = this.__services || {};

  beyo.__services['error'] = true;
  //this.__services['error'] = true;

  throw Error('Test service');
}