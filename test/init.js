
var path = require('path');
var should = require('should');

var TestError = require('error-factory')('beyo.testing.TestError');

// setting globals
GLOBAL.assert = global.assert = require('assert');

// module root path
GLOBAL.__root = global.__root = path.resolve(__dirname, '..');


GLOBAL.BeyoMock = global.BeyoMock = function BeyoMock(requireCallback) {
  this.require = function (module) {
    var modulePath = path.resolve(this.rootPath, module);
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
  this.rootPath = path.resolve(__dirname, 'fixtures');
  this.env = 'test';
};
require('util').inherits(BeyoMock, require('events').EventEmitter);


GLOBAL.ModuleContextMock = global.ModuleContextMock = function ModuleContext() {

};

GLOBAL.should = global.should = should;

should.allFailAsyncPromise = function allFailAsyncPromise(testValues, cb, errcb) {
  var p = [];
  var beyo = cb.length ? new BeyoMock() : undefined;
  var errCount = 0;
  var count = testValues.length;

  for (var i = 0; i < count; ++i) (function (testValue) {
    try {
      p.push(cb(beyo, testValue).then(function () {
        return JSON.stringify(testValue);
      }));
    } catch (e) {
      e.should.be.an.Error
        .and.have.property('message')
        .equal(errcb(testValue));

      ++errCount;
    }
  })(testValues[i]);

  return Promise.all(p).then(function (errors) {
    errors = errors.filter(function (err) {
      return !!err;
    });

    errCount.should.be.equal(testValues.length);

    return errors.length ? TestError("Failed with values: " + errors.join(', ')) : undefined;
  });
}