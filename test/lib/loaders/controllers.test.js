

describe('Test Controllers Loader', function () {

  var loader = require(__root + '/lib/loaders/controllers');
  var TestError = require('error-factory')('beyo.testing.TestError');

  it('should fail when no options specified'/*, function () {
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
  }*/);

  it('should fail with invalid options value'/*, function () {
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
  }*/);

  it('should fail with no path specified'/*, function () {
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
  }*/);

  it('should fail with invalid path value'/*, function () {
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
  }*/);

  it('should faile with no module name specified'/*, function () {
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
  }*/);

  it('should fail with invalid module name'/*, function () {
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
  }*/);

  it('should fail with no context specified'/*, function () {
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
  }*/);

  it('should fail with invalid context'/*, function () {
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
  }*/);


  it('should load controllers'/*, function () {
    var beyo = new BeyoMock();
    var context = new ModuleContextMock();
    var options = {
      path: 'simple-app/app/modules/test/controllers',
      moduleName: 'test',
      context: context
    };
    var controllers = yield loader(beyo, options);

    beyo.should.have.ownProperty('__controllers');
    beyo.__controllers.should.have.ownProperty('index').and.be.true;

    context.should.have.ownProperty('__controllers');
    context.__controllers.should.have.ownProperty('index').and.be.true;

    controllers.should.have.ownProperty('test/index').and.equal('index');

    controllers.should.not.have.property('test/error');
    controllers.should.not.have.property('test/noreturn');

  }*/);


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

    /*
    after(function () {
      controllers = yield loader(beyo, options);

      Object.keys(eventsFired).should.have.lengthOf(3);

      controllers.should.have.ownProperty('test/index').and.equal('index');
    });
    */

    it('should emit `controllerLoad`'/*, function () {
      beyo.on('controllerLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoad'] = true;
      });
    }*/);
    it('should emit `controllerLoadError`'/*, function () {
      beyo.on('controllerLoadError', function (err, evt) {
        err.should.be.an.Error;
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoadError'] = true;
      });
    }*/);
    it('should emit `controllerLoadComplete`'/*, function () {
      beyo.on('controllerLoadComplete', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoadComplete'] = true;
      });
    }*/);

  });
});