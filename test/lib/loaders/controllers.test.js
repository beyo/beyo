

describe('Test Controllers Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/controllers');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(1000);

  it('should fail when no options specified', function (done) {
    should.allFailAsyncPromise([undefined], function () {
      return loader();
    }, function (value) {
      return 'No options specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid options value', function (done) {
    var invalidOptions = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidOptions, function (beyo, value) {
      return loader(beyo, value);
    }, function (value) {
      return 'Invalid options value: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with no path specified', function (done) {
    var invalidOptions = [
      {}
    ];

    should.allFailAsyncPromise(invalidOptions, function (beyo, value) {
      return loader(beyo, value);
    }, function () {
      return 'Controllers path not specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid path value', function (done) {
    var invalidPaths = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidPaths, function (beyo, value) {
      return loader(beyo, { path: value });
    }, function (value) {
      return 'Invalid path value: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with no module name specified', function (done) {
    should.allFailAsyncPromise([undefined], function (beyo) {
      return loader(beyo, { path: 'foo' });
    }, function () {
      return 'Module name not specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid module name value', function () {
    var invalidModuleNames = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidModuleNames, function (beyo, value) {
      return loader(beyo, { path: 'foo', moduleName: value });
    }, function (value) {
      return 'Invalid module name: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with no context specified', function (done) {
    should.allFailAsyncPromise([undefined], function (beyo) {
      return loader(beyo, { path: 'foo', moduleName: 'bar' });
    }, function () {
      return 'Module context not specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid context', function (done) {
    var invalidContexts = [
      undefined, null, false, true, void 0, 0, 1, [], /./, function () {}, '', 'abc'
    ];

    should.allFailAsyncPromise(invalidContexts, function (beyo, value) {
      return loader(beyo, { path: 'foo', moduleName: 'bar', context: value });
    }, function (value) {
      return 'Invalid module context: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });


  it('should load controllers', function (done) {
    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/controllers',
      moduleName: 'test',
      context: context
    };

    loader(beyo, options).then(function (controllers) {
      beyo.should.have.ownProperty('__controllers');
      beyo.__controllers.should.have.ownProperty('index').and.be.true;

      context.should.have.ownProperty('__controllers');
      context.__controllers.should.have.ownProperty('index').and.be.true;

      controllers.should.have.ownProperty('test/index').and.equal('index');

      controllers.should.not.have.property('test/error');
      controllers.should.not.have.property('test/noreturn');

      done();
    });
  });


  describe('Controllers loader events', function () {

    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/controllers',
      moduleName: 'test',
      context: context
    };
    var controllers;
    var eventsFired = {};

    after(function (done) {
      loader(beyo, options).then(function (controllers) {
        Object.keys(eventsFired).should.have.lengthOf(3);

        controllers.should.have.ownProperty('test/index').and.equal('index');

        done();
      });
    });

    it('should emit `controllerLoad`', function () {
      beyo.on('controllerLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoad'] = true;
      });
    });
    it('should emit `controllerLoadError`', function () {
      beyo.on('controllerLoadError', function (err, evt) {
        err.should.be.an.Error;
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoadError'] = true;
      });
    });
    it('should emit `controllerLoadComplete`', function () {
      beyo.on('controllerLoadComplete', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoadComplete'] = true;
      });
    });

  });
});