

describe('Test Models Loader', function () {

  var loader = require(__root + '/lib/loaders/models');
  var TestError = require('error-factory')('beyo.testing.TestError');

  it('should fail when no options specified', function * () {
    try {
      yield loader();

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('No options specified');
      }
    }
  });

  it('should fail with invalid options value', function * () {
    var invalidOptions = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidOptions.length; i < iLen; ++i) {
      try {
        yield loader(beyo, invalidOptions[i]);

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid options value: ' + String(invalidOptions[i]));
        }
      }
    }
  });

  it('should fail with no path specified', function * () {
    var beyo = new BeyoMock();

    try {
      yield loader(beyo, {});

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Models path not specified');
      }
    }
  });

  it('should fail with invalid path value', function * () {
    var invalidPaths = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidPaths.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { path: invalidPaths[i]});

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid path value: ' + String(invalidPaths[i]));
        }
      }
    }
  });

  it('should faile with no module name specified', function * () {
    var beyo = new BeyoMock();

    try {
      yield loader(beyo, { path: 'foo' });

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Module name not specified');
      }
    }
  });

  it('should fail with invalid module name', function * () {
    var invalidPaths = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidPaths.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { path: 'foo', moduleName: invalidPaths[i]});

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid module name: ' + String(invalidPaths[i]));
        }
      }
    }
  });

  it('should fail with no context specified', function * () {
    var beyo = new BeyoMock();

    try {
      yield loader(beyo, { path: 'foo', moduleName: 'bar' });

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Module context not specified');
      }
    }
  });

  it('should fail with invalid context', function * () {
    var invalidContexts = [
      undefined, null, false, true, void 0, 0, 1, [], /./, function () {}, '', 'abc'
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidContexts.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { path: 'foo', moduleName: 'bar', context: invalidContexts[i] });

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid module context: ' + String(invalidContexts[i]));
        }
      }
    }
  });


  it('should load models', function * () {
    var beyo = new BeyoMock();
    var context = {};
    var options = {
      path: 'simple-app/app/modules/test/models',
      moduleName: 'test',
      context: context
    };
    var models = yield loader(beyo, options);

    beyo.should.have.ownProperty('__models');
    beyo.__models.should.have.ownProperty('foo').and.be.true;
    beyo.__models.should.have.ownProperty('noresult').and.be.true;

    context.should.have.ownProperty('__models');
    context.__models.should.have.ownProperty('foo').and.be.true;
    context.__models.should.have.ownProperty('noresult').and.be.true;

    models.should.have.ownProperty('foo').and.eql({ foo: 'bar' });

    models.should.not.have.ownProperty('noresult');

  });


  describe('Model loader events', function () {

    var beyo = new BeyoMock();
    var context = {};
    var options = {
      path: 'simple-app/app/modules/test/models',
      moduleName: 'test',
      context: context
    };
    var models;
    var eventsFired = {};

    after(function * () {
      models = yield loader(beyo, options);

      Object.keys(eventsFired).should.have.lengthOf(3);

      models.should.have.ownProperty('foo').and.eql({ foo: 'bar' });
    });

    it('should emit `modelLoad`', function () {
      beyo.on('modelLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['modelLoad'] = true;
      });
    });
    it('should emit `modelLoadError`', function () {
      beyo.on('modelLoadError', function (err, evt) {
        err.should.be.an.Error;
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['modelLoadError'] = true;
      });
    });
    it('should emit `modelLoadComplete`', function () {
      beyo.on('modelLoadComplete', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['modelLoadComplete'] = true;
      });
    });

  });
});