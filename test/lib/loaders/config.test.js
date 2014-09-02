

describe('Test Config Loader', function () {

  var loader = require(__root + '/lib/loaders/config');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(1000);

  it('should fail when path not specified', function * () {
    try {
      yield loader();

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Config path not specified');
      }
    }
  });


  describe('Config loader events', function () {

    var beyo = new BeyoMock();
    var moduleName = 'test' + Date.now();
    var configOptions = {
      path: 'simple-app/app/conf',
      moduleName: moduleName
    };
    var config;
    var eventsFired = {};

    after(function * () {
      config = yield loader(beyo, configOptions);

      Object.keys(eventsFired).should.have.lengthOf(4);

      config.conflictKey.should.equal('original');
    });

    it('should emit `configLoad`', function () {
      beyo.on('configLoad', function (evt) {
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoad'] = true;
      });
    });
    it('should emit `configLoadConflict`', function () {
      beyo.on('configLoadConflict', function (key, src, dest, evt) {
        key.should.equal('conflictKey');
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoadConflict'] = true;
      });
    });
    it('should emit `configLoadError`', function () {
      beyo.on('configLoadError', function (err, evt) {
        err.should.be.an.Error;
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoadError'] = true;
      });
    });
    it('should emit `configLoadComplete`', function () {
      beyo.on('configLoadComplete', function (evt) {
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoadComplete'] = true;
      });
    });

  });

  describe('Config environments', function () {

    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/conf'
    };
    var config;

    before(function * () {
      config = yield loader(beyo, configOptions);
    });

    it('should load partial env config', function () {
      config['env-test'].t.should.be.true;
      config['env-test'].te.should.be.true;
      config['env-test'].tes.should.be.true;
      config['env-test'].test.should.be.true;
      config['env-test'].testing.should.be.true;
    });

    it('should unspecified env config');
    it('should not load wrong env config');

  });


});