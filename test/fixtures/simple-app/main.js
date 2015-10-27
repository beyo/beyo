
module.exports = function main(beyo) {
  beyo.__main = beyo.__main || {};
  this.__main = this.__main || {};

  beyo.__main['default'] = true;
  this.__main['default'] = true;

  return Promise.resolve();
}
