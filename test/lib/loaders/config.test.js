

describe('Test Config Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/config');
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
      return 'Config path not specified';
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

  it('should fail with invalid module name value', function () {
    var invalidModuleNames = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidModuleNames, function (beyo, value) {
      return loader(beyo, { path: 'foo', moduleName: value });
    }, function (value) {
      return 'Invalid module name: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });

  it('should reject invalid path', function (done) {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/__INVALID_PATH'
    };

    loader(beyo, configOptions).then(function (config) {
      done(TestError("Failed"));
    }).catch(function (err) {
      err.should.be.instanceof.Error;

      done();
    });
  });

  it('should sanitize keys with dots', function (done) {
    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/conf'
    };

    loader(beyo, configOptions).then(function (config) {
      config.should.have.ownProperty('config.with.dot').and.have.ownProperty('dot.test').be.true;

      done();
    }).catch(function (err) {
      done(err);
    });
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

    after(function (done) {
      loader(beyo, configOptions).then(function (config) {
        Object.keys(eventsFired).should.have.lengthOf(4);

        config.conflictKey.should.equal('original');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should emit `configLoad`', function () {
      beyo.on('configLoad', function (evt) {
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoad'] = true;
      });
    });
    it('should emit `configLoadConflict`', function () {
      beyo.on('configLoadConflict', function (evt, conflictData) {
        conflictData.currentKeyPath.should.equal('conflictKey');
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoadConflict'] = true;
      });
    });
    it('should emit `configLoadError`', function () {
      beyo.on('configLoadError', function (evt) {
        evt.error.should.be.an.Error;
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoadError'] = true;
      });
    });
    it('should emit `configLoaded`', function () {
      beyo.on('configLoaded', function (evt) {
        evt.moduleName.should.equal(moduleName);

        eventsFired['configLoaded'] = true;
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

    it('should merge two objects', function (done) {
      loader(beyo, configOptions).then(function (config) {
        config.should.have.ownProperty('mergeKey');
        config.mergeKey.should.have.ownProperty('foo').equal(123);
        config.mergeKey.should.have.ownProperty('bar').equal(456);

        // NOTE : configuration is loaded alphabetically, therefore, index.json comes before merge.json
        config.mergeKey.should.have.ownProperty('override').equal('merged');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

  });


  describe('Config environments', function () {

    var beyo = new BeyoMock();
    var configOptions = {
      path: 'simple-app/app/conf'
    };
    var config;

    it('should load partial env config (test)', function (done) {
      beyo.env = 'test';

      loader(beyo, configOptions).then(function (config) {
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

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should load full env config (development)', function (done) {
      beyo.env = 'development';
      loader(beyo, configOptions).then(function (config) {
        config.should.not.have.ownProperty('env-test');

        config['env-dev'].d.should.be.true;
        config['env-dev'].de.should.be.true;
        config['env-dev'].dev.should.be.true;
        config['env-dev'].devel.should.be.true;
        config['env-dev'].development.should.be.true;

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should load config providing multiple env', function (done) {
      // A
      beyo.env = 'a';
      loader(beyo, configOptions).then(function (config) {
        config.should.not.have.ownProperty('env-test');
        config.should.not.have.ownProperty('env-dev');

        config['env-ab'].a.should.be.true;
        config['env-ab'].ab.should.be.true;
        config['env-ab'].ba.should.be.true;
        config['env-ab'].should.not.have.ownProperty('b');

        // B
        beyo.env = 'b';
        return loader(beyo, configOptions);
      }).then(function (config) {
        config.should.not.have.ownProperty('env-test');
        config.should.not.have.ownProperty('env-dev');

        config['env-ab'].b.should.be.true;
        config['env-ab'].ab.should.be.true;
        config['env-ab'].ba.should.be.true;
        config['env-ab'].should.not.have.ownProperty('a');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should not load unspecified config (prod)', function (done) {
      beyo.env = 'prod';
      loader(beyo, configOptions).then(function (config) {
        config.should.not.have.ownProperty('env-test');
        config.should.not.have.ownProperty('env-dev');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should not load wrong env config (est)', function (done) {
      beyo.env = 'est';
      loader(beyo, configOptions).then(function (config) {
        config.should.not.have.ownProperty('env-test');
        config.should.not.have.ownProperty('env-dev');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should load even if no env specified', function (done) {
      beyo.env = undefined;
      loader(beyo, configOptions).then(function (config) {

        config.should.not.have.ownProperty('env-test');
        config.should.not.have.ownProperty('env-dev');

        done();
      }).catch(function (err) {
        done(err);
      });
    });

  });


});