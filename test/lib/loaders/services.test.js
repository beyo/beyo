

describe('Test Services Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/services');
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
      return 'Services path not specified';
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
    should.allFailAsyncPromise([undefined], function (beyo, value) {
      return loader(beyo, { path: 'foo' });
    }, function () {
      return 'Module name not specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid module name', function (done) {
    var invalidModuleNames = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidModuleNames, function (beyo, invalidModuleName) {
      return loader(beyo, { path: 'foo', moduleName: invalidModuleName });
    }, function (invalidModuleName) {
      return 'Invalid module name: ' + String(invalidModuleName);
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with no context specified', function (done) {
    should.allFailAsyncPromise([undefined], function (beyo, value) {
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

    should.allFailAsyncPromise(invalidContexts, function (beyo, invalidContext) {
      return loader(beyo, { path: 'foo', moduleName: 'bar', context: invalidContext });
    }, function (invalidContext) {
      return 'Invalid module context: ' + String(invalidContext);
    }).then(function (err) {
      done(err);
    });
  });

  it('should load services', function (done) {
    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/services',
      moduleName: 'test',
      context: context
    };

    loader(beyo, options).then(function (services) {
      beyo.should.have.ownProperty('__services');
      beyo.__services.should.have.ownProperty('error').and.be.true;
      beyo.__services.should.have.ownProperty('index').and.be.true;
      beyo.__services.should.have.ownProperty('noreturn').and.be.true;

      context.should.have.ownProperty('__services');
      context.__services.should.not.have.ownProperty('error');
      context.__services.should.have.ownProperty('index').and.be.true;
      context.__services.should.have.ownProperty('noreturn');

      services.should.not.have.ownProperty('test/error');
      services.should.have.ownProperty('test/index').and.equal('index');
      services.should.not.have.ownProperty('test/noreturn');

      done();
    }).catch(function (err) {
      done(err);
    });
  });


  describe('Services loader events', function () {

    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/services',
      moduleName: 'test',
      context: context
    };
    var services;
    var eventsFired = {};

    after(function (done) {
      loader(beyo, options).then(function (services) {
        Object.keys(eventsFired).should.have.lengthOf(3);

        services.should.have.ownProperty('test/index').and.equal('index');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should emit `serviceLoad`', function () {
      beyo.on('serviceLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['serviceLoad'] = true;
      });
    });
    it('should emit `serviceLoadError`', function () {
      beyo.on('serviceLoadError', function (evt) {
        evt.error.should.be.an.Error;
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['serviceLoadError'] = true;
      });
    });
    it('should emit `serviceLoaded`', function () {
      beyo.on('serviceLoaded', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['serviceLoaded'] = true;
      });
    });

  });
});