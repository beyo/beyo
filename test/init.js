
var path = require('path');

// setting globals
GLOBAL.assert = global.assert = require('assert');

// module root path
GLOBAL.__root = global.__root = path.resolve(__dirname, '..');


GLOBAL.BeyoMock = global.BeyoMock = function BeyoMock() {
  this.appRequire = function (module) {
    return require(path.resolve(this.appRoot, module));
  };
  this.appRoot = path.resolve(__dirname, 'fixtures');
  this.env = 'test';
};
require('util').inherits(BeyoMock, require('events').EventEmitter);

