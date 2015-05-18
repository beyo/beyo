

describe('Test Models Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/models');
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
      return 'Models path not specified';
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


  it('should load models', function (done) {
    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/models',
      moduleName: 'test',
      context: context
    };

    loader(beyo, options).then(function (models) {
      beyo.should.have.ownProperty('__models');
      beyo.__models.should.have.ownProperty('foo').and.be.true;
      beyo.__models.should.have.ownProperty('noresult').and.be.true;

      context.should.have.ownProperty('__models');
      context.__models.should.have.ownProperty('foo').and.be.true;
      context.__models.should.have.ownProperty('noresult').and.be.true;

      models.should.have.ownProperty('test/foo').and.eql({ foo: 'bar' });

      models.should.not.have.ownProperty('test/noresult');

      done();
    }).catch(function (err) {
      done(err);
    });
  });


  describe('Model loader events', function () {

    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/models',
      moduleName: 'test2',
      context: context
    };
    var models;
    var eventsFired = {};

    after(function (done) {
      loader(beyo, options).then(function (models) {
        Object.keys(eventsFired).should.have.lengthOf(3);

        models.should.have.ownProperty('test2/foo').and.eql({ foo: 'bar' });

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should emit `modelLoad`', function () {
      beyo.on('modelLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['modelLoad'] = true;
      });
    });
    it('should emit `modelLoadError`', function () {
      beyo.on('modelLoadError', function (evt) {
        evt.error.should.be.an.Error;
        evt.should.have.property('moduleName').equal(options.moduleName);

        eventsFired['modelLoadError'] = true;
      });
    });
    it('should emit `modelLoaded`', function () {
      beyo.on('modelLoaded', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['modelLoaded'] = true;
      });
    });

  });
});