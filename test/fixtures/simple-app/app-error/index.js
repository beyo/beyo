
module.exports = function * appInit(beyo) {
  beyo.__app = beyo.__app || {};
  this.__app = this.__app || {};

  beyo.__app['error'] = true;
  this.__app['error'] = true;

  throw new Error('Application Error');
}