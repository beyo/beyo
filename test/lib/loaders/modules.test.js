

describe('Test Modules Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/modules');
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
      return 'Modules path not specified';
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

  it('should load modules', function (done) {
    var beyo = new BeyoMock();

    loader(beyo, { path: 'simple-app/app/modules/' }).then(function (modules) {
      modules.should.be.instanceOf(Object)
        .and.have.property('test').be.instanceOf(Object)
        .and.have.property('module').be.instanceOf(Object)
        .and.have.property('name').equal('test');

      beyo.__modules.test.should.be.true;

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should cleanup error\'ed modules', function (done) {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/modules'
    };

    loader(beyo, configOptions).then(function (modules) {
      modules.should.not.have.property('missing-dependency');
      modules.should.not.have.property('dependency-test');

      modules.should.have.property('test');
      modules.should.have.property('test-dependent');

      done();
    }).catch(function (err) {
      done(err);
    });
  });


  describe('Modules loader events', function () {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/modules'
    };
    var modules;
    var eventsFired = {};


    after(function (done) {
      loader(beyo, configOptions).then(function (modules) {
        Object.keys(eventsFired).should.have.lengthOf(4);

        done();
      }).catch(function (err) {
        done(err);
      })

    });

    it('should emit `moduleLoad`', function () {
      beyo.on('moduleLoad', function (evt) {
        eventsFired['moduleLoad'] = true;
      });
    });
    it('should emit `moduleLoadConflict`', function () {
      beyo.on('moduleLoadConflict', function (evt) {
        //module.should.be.instanceOf(Object);

        eventsFired['moduleLoadConflict'] = true;
      });
    });
    it('should emit `moduleLoadError`', function () {
      beyo.on('moduleLoadError', function (evt) {
        evt.error.should.be.instanceOf(Error);

        eventsFired['moduleLoadError'] = true;
      });
    });
    it('should emit `moduleLoaded`', function () {
      beyo.on('moduleLoaded', function (evt) {
        eventsFired['moduleLoaded'] = true;
      });
    });

  });

  describe('Test errors in module.json', function () {

    it('should emit error on require error', function (done) {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/error-modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (evt) {
        evt.error.should.be.instanceOf(Error);

        if (evt.error.message.indexOf('simple-app/app/error-modules/invalid-module-json') > -1) {
          errorDetected = true;
        }
      });

      loader(beyo, configOptions).then(function (modules) {
        errorDetected.should.be.true;

        done();
      }).catch(function (err) {
        done(err);
      });
    });


    it('should emit error on missing name', function (done) {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/error-modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (evt) {
        evt.error.should.be.instanceOf(Error);

        if (evt.error.message === 'No name defined for module at: simple-app/app/error-modules/missing-name') {
          errorDetected = true;
        }
      });

      loader(beyo, configOptions).then(function (modules) {
        errorDetected.should.be.true;

        done();
      }).catch(function (err) {
        done(err);
      })

    });


    it('should emit error on invalid name', function (done) {
      var invalidNames = [
        undefined, null, false, true, void 0, 0, 1, /./, function () {}, '',
        '0', '1', '123', '/'  // TODO more invalid strings?
      ];
      var testQueue = [];
      var testCount = 0;

      for (var i = 0, iLen = invalidNames.length; i < iLen; ++i) testQueue.push((function (invalidName) {
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

        beyo.on('moduleLoadError', function (evt) {
          evt.error.should.be.instanceOf(Error);

          if (evt.error.message === 'Invalid module name: ' + String(invalidName)) {
            errorDetected = true;
          } else if (evt.error.message === 'Module name must be a string at: simple-app/app/error-modules/missing-name') {
            errorDetected = true;
          }
        });

        loader(beyo, configOptions).then(function (modules) {

          errorDetected.should.be.true;
          testCount++;
        });

      })(invalidNames[i]));

      Promise.all(testQueue).then(function () {
        done();
      }).catch(done);
    });


    it('should emit conflict on duplicate module names', function (done) {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/modules'
      };
      var conflictDetected = false;
      var modules;

      beyo.on('moduleLoadConflict', function (evt) {
        evt.module.should.have.properties({
          'name': 'test',
          'description': 'Beyo simple-app\'s default test module (conflict)'
        });

        conflictDetected = true;
      });

      loader(beyo, configOptions).then(function (modules) {
        conflictDetected.should.be.true;

        modules.should.have.ownProperty('test').be.instanceOf(Object)
          .and.have.ownProperty('module').be.instanceOf(Object)
          .and.have.properties({
            'name': 'test',
            'description': 'Beyo simple-app\'s default test module'
          });

        done();
      }).catch(function (err) {
        done(err);
      });
    });


    it('should emit error on missing module dependency', function (done) {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (evt) {
        evt.error.should.be.instanceOf(Error);

        if (evt.error.message === 'Missing module: invalid-dependency-module-that-do-not-exist') {
          //evt.moduleName.should.equal('invalid-dependency-module-that-do-not-exist');

          errorDetected = true;
        }
      });

      loader(beyo, configOptions).then(function (modules) {
        errorDetected.should.be.true;

        done();
      }).catch(function (err) {
        done(err);
      });
    });


    it('should emit error on cyclical module dependencies', function (done) {
      var beyo = new BeyoMock();
      var configOptions = {
        path: 'simple-app/app/modules'
      };
      var errorDetected = false;

      beyo.on('moduleLoadError', function (evt) {
        evt.error.should.be.instanceOf(Error);

        if (evt.error.message === 'Cyclical dependency found in dependency-test') {
          //console.log("*** CYCLICAL", evt);
          //evt.moduleName.should.equal('dependency-test');

          errorDetected = true;
        }
      });

      loader(beyo, configOptions).then(function (modules) {
        errorDetected.should.be.true;

        done();
      }).catch(function (err) {
        done(err);
      });
    });

  });

});