
var path = require('path');

// setting globals
GLOBAL.assert = global.assert = require('assert');

// module root path
GLOBAL.__root = global.__root = path.resolve(__dirname, '..');


GLOBAL.BeyoMock = global.BeyoMock = function BeyoMock() {
  this.appRequire = function (module) {
    var modulePath = path.resolve(this.appRoot, module);

    if (require.cache[modulePath]) {
      delete require.cache[modulePath];
    }

    return require(modulePath);
  };
  this.appRoot = path.resolve(__dirname, 'fixtures');
  this.env = 'test';
};
require('util').inherits(BeyoMock, require('events').EventEmitter);


GLOBAL.ModuleContextMock = global.ModuleContextMock = function ModuleContext() {

};