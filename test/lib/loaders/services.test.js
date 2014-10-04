

describe('Test Services Loader', function () {

  var loader = require(__root + '/lib/loaders/services');
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
          .equal('Controllers path not specified');
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


  it('should load services', function * () {
    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/services',
      moduleName: 'test',
      context: context
    };
    var services = yield loader(beyo, options);

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

    after(function * () {
      services = yield loader(beyo, options);

      Object.keys(eventsFired).should.have.lengthOf(3);

      services.should.have.ownProperty('test/index').and.equal('index');
    });

    it('should emit `serviceLoad`', function () {
      beyo.on('serviceLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['serviceLoad'] = true;
      });
    });
    it('should emit `serviceLoadError`', function () {
      beyo.on('serviceLoadError', function (err, evt) {
        err.should.be.an.Error;
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['serviceLoadError'] = true;
      });
    });
    it('should emit `serviceLoadComplete`', function () {
      beyo.on('serviceLoadComplete', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['serviceLoadComplete'] = true;
      });
    });

  });
});