

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

  it('should ignore invalid path', function * () {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/__INVALID_PATH'
    };
    var config = yield loader(beyo, configOptions);

    config.should.eql({});

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


  describe('Conflict keys', function () {

    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/conf'
    };
    var config;

    beyo.env = undefined;

    it('should merge two objects', function * () {
      config = yield loader(beyo, configOptions);

      config.should.have.ownProperty('mergeKey');
      config.mergeKey.should.have.ownProperty('foo').and.equal(123);
      config.mergeKey.should.have.ownProperty('bar').and.equal(456);

      // NOTE : configuration is loaded alphabetically, therefore, index.json comes before merge.json
      config.mergeKey.should.have.ownProperty('override').and.equal('merged');
    });

  });


  describe('Config environments', function () {

    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/conf'
    };
    var config;

    it('should load partial env config (test)', function * () {
      beyo.env = 'test';
      config = yield loader(beyo, configOptions);

      config.should.not.have.ownProperty('env-dev');

      config['env-test'].t.should.be.true;
      config['env-test'].te.should.be.true;
      config['env-test'].tes.should.be.true;
      config['env-test'].test.should.be.true;
      config['env-test'].testing.should.be.true;

      config['env-test']['a']['b']['c'].t.should.be.true;
      config['env-test']['a']['b']['c'].te.should.be.true;
      config['env-test']['a']['b']['c'].tes.should.be.true;
      config['env-test']['a']['b']['c'].test.should.be.true;
      config['env-test']['a']['b']['c'].testing.should.be.true;
    });

    it('should load full env config (development)', function * () {
      beyo.env = 'development';
      config = yield loader(beyo, configOptions);

      config.should.not.have.ownProperty('env-test');

      config['env-dev'].d.should.be.true;
      config['env-dev'].de.should.be.true;
      config['env-dev'].dev.should.be.true;
      config['env-dev'].devel.should.be.true;
      config['env-dev'].development.should.be.true;
    });

    it('should not load unspecified config (prod)', function * () {
      beyo.env = 'prod';
      config = yield loader(beyo, configOptions);

      config.should.not.have.ownProperty('env-test');
      config.should.not.have.ownProperty('env-dev');
    });

    it('should not load wrong env config (est)', function * () {
      beyo.env = 'est';
      config = yield loader(beyo, configOptions);

      config.should.not.have.ownProperty('env-test');
      config.should.not.have.ownProperty('env-dev');
    });

    it('should load even if no env specified', function * () {
      beyo.env = undefined;
      config = yield loader(beyo, configOptions);

      config.should.not.have.ownProperty('env-test');
      config.should.not.have.ownProperty('env-dev');
    });

  });


});