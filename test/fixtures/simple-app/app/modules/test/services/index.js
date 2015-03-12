

module.exports = function indexService(beyo) {
  beyo.__services = beyo.__services || {};
  this.__services = this.__services || {};

  beyo.__services['index'] = true;
  this.__services['index'] = true;

  return Promise.resolve('index');
}