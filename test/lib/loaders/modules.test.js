

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


  it('should emit conflict on duplicate module names');


  it('should emit error on missing module dependency');


  it('should emit error on invalid module name');


  it('should emit error on cyclical module dependencies');


  it('should cleanup error\'ed modules');


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
        // TODO : fix this assertion
        //evt.moduleName.should.equal(moduleName);

        eventsFired['moduleLoad'] = true;
      });
    });
    it('should emit `moduleLoadConflict`', function () {
      beyo.on('moduleLoadConflict', function (key, src, dest, evt) {
        //key.should.equal('conflictKey');
        //evt.moduleName.should.equal(moduleName);

        eventsFired['moduleLoadConflict'] = true;
      });
    });
    it('should emit `moduleLoadError`', function () {
      beyo.on('moduleLoadError', function (err, evt) {
        err.should.be.an.Error;
        //evt.moduleName.should.equal(moduleName);

        eventsFired['moduleLoadError'] = true;
      });
    });
    it('should emit `moduleLoadComplete`', function () {
      beyo.on('moduleLoadComplete', function (evt) {
        //evt.moduleName.should.equal(moduleName);

        eventsFired['moduleLoadComplete'] = true;
      });
    });

  });




});