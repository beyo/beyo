
var path = require('path');

// setting globals
GLOBAL.assert = global.assert = require('assert');

// module root path
GLOBAL.__root = global.__root = path.resolve(__dirname, '..');


GLOBAL.BeyoMock = global.BeyoMock = function BeyoMock(requireCallback) {
  this.appRequire = function (module) {
    var modulePath = path.resolve(this.appRoot, module);
    var mod;

    if (require.cache[modulePath]) {
      delete require.cache[modulePath];
    }

    mod = require(modulePath);

    if (requireCallback) {
      requireCallback(mod, module, modulePath);
    }

    return mod;
  };
  this.appRoot = path.resolve(__dirname, 'fixtures');
  this.env = 'test';
};
require('util').inherits(BeyoMock, require('events').EventEmitter);


GLOBAL.ModuleContextMock = global.ModuleContextMock = function ModuleContext() {

};