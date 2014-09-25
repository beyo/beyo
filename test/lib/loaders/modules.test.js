

describe('Test Modules Loader', function () {

  var loader = require(__root + '/lib/loaders/modules');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(1000);

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
          .equal('Modules path not specified');
      }
    }
  });

  it('should fail with invalid path value', function * () {
    var invalidPaths = [
      undefined, null, true, false, 0, 1, {}, [], /./, function () {}
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

  it('should load modules', function * () {
    var beyo = new BeyoMock();
    var modules = yield loader(beyo, { path: 'simple-app/app/modules/' });

    modules.should.be.an.Object.and.have.property('test');
    modules.test.should.have.ownProperty('name').equal('test');

    beyo.__modules.test.should.be.true;
  });

  it('should cleanup error\'ed modules', function * () {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/modules'
    };
    var modules = yield loader(beyo, configOptions);

    modules.should.not.have.ownProperty('missing-dependency');
    modules.should.not.have.ownProperty('dependency-test');

    modules.should.have.ownProperty('test');
    modules.should.have.ownProperty('test-dependent');
  });


  describe('Modules loader events', function () {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/modules'
    };
    var modules;
    var eventsFired = {};

    after(function * () {
      modules = yield loader(beyo, configOptions);

      Object.keys(eventsFired).should.have.lengthOf(4);
    });

    it('should emit `moduleLoad`', function () {
      beyo.on('moduleLoad', function (evt) {
        eventsFired['moduleLoad'] = true;
      });
    });
    it('should emit `moduleLoadConflict`', function () {
      beyo.on('moduleLoadConflict', function (module, evt) {
        module.should.be.an.Object;

        eventsFired['moduleLoadConflict'] = true;
      });
    });
    it('should emit `moduleLoadError`', function () {
      beyo.on('moduleLoadError', function (err, evt) {
        err.should.be.an.Error;

        eventsFired['moduleLoadError'] = true;
      });
    });
    it('should emit `moduleLoadComplete`', function () {
      beyo.on('moduleLoadComplete', function (evt) {
        eventsFired['moduleLoadComplete'] = true;
      });
    });

  });

  describe('Test errors in module.json', function () {

    it('should emit error on require error', function * () {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/error-modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (err, evt) {
        err.should.be.an.Error;

        if (err.message === 'Could not load moodule.json at: simple-app/app/error-modules/invalid-module-json') {
          errorDetected = true;
        }
      });

      yield loader(beyo, configOptions);

      errorDetected.should.be.true;
    });

    it('should emit error on missing name', function * () {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/error-modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (err, evt) {
        err.should.be.an.Error;

        if (err.message === 'No name defined for module at: simple-app/app/error-modules/missing-name') {
          errorDetected = true;
        }
      });

      yield loader(beyo, configOptions);

      errorDetected.should.be.true;
    });

    it('should emit error on invalid name', function * () {
      var invalidNames = [
        undefined, null, false, true, void 0, 0, 1, /./, function () {}, '',
        '0', '1', '123', '/'  // TODO more invalid strings?
      ];
      var testQueue = [];
      var testCount = 0;

      for (var i = 0, iLen = invalidNames.length; i < iLen; ++i) testQueue.push((function * (invalidName) {
        var beyo = new BeyoMock(replaceName);
        var configOptions = {
          path: 'simple-app/app/error-modules'
        };
        var errorDetected = false;

        function replaceName(mod) {
          if (!('name' in mod)) {
            mod.name = invalidName;
          }
        }

        beyo.on('moduleLoadError', function (err, evt) {
          err.should.be.an.Error;

          if (err.message === 'Invalid module name at: simple-app/app/error-modules/missing-name') {
            errorDetected = true;
          }
        });

        yield loader(beyo, configOptions);

        errorDetected.should.be.true;
        testCount++;

      })(invalidNames[i]));

      yield testQueue;

      testCount.should.equal(invalidNames.length);
    });

    it('should emit conflict on duplicate module names', function * () {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/modules'
      };
      var conflictDetected = false;
      var modules;

      beyo.on('moduleLoadConflict', function (module, evt) {
        module.should.have.ownProperty('name').equal('test');
        module.should.have.ownProperty('description').equal('Beyo simple-app\'s default test module (conflict)');
        conflictDetected = true;
      });

      modules = yield loader(beyo, configOptions);

      conflictDetected.should.be.true;

      modules.should.have.ownProperty('test').be.an.Object;
      modules.test.should.have.ownProperty('name').equal('test');
      modules.test.should.have.ownProperty('description').equal('Beyo simple-app\'s default test module');
    });


    it('should emit error on missing module dependency', function * () {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (err, evt) {
        err.should.be.an.Error;

        if (err.message === 'Missing module: invalid-dependency-module-that-do-not-exist') {
          evt.moduleName.should.equal('invalid-dependency-module-that-do-not-exist');

          errorDetected = true;
        }
      });

      yield loader(beyo, configOptions);

      errorDetected.should.be.true;
    });

    it('should emit error on cyclical module dependencies', function * () {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (err, evt) {
        err.should.be.an.Error;

        if (err.message === 'Cyclical dependency found in dependency-test') {
          evt.moduleName.should.equal('dependency-test');

          errorDetected = true;
        }
      });

      yield loader(beyo, configOptions);

      errorDetected.should.be.true;
    });


  });

});