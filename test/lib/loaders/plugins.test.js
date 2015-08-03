

describe('Test Plugins Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/plugins');
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
      return 'Plugins path not specified';
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

  it('should fail with invalid plugins value', function (done) {
    var invalidPlugins = [
      undefined, null, true, false, void 0, 0, 1, '', 'abc', '0', '1', [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidPlugins, function (beyo, invalidPlugins) {
      return loader(beyo, { path: 'simple-app/plugins', plugins: invalidPlugins });
    }, function (invalidPlugins) {
      return 'Invalid plugins map value: ' + String(invalidPlugins);
    }).then(function (err) {
      done(err);
    });
  });

  it('should load plugins', function (done) {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins'
    };

    loader(beyo, pluginsOptions).then(function (plugins) {
      beyo.should.have.ownProperty('__plugins');
      beyo.__plugins.should.have.ownProperty('foo').and.be.true;

      plugins.should.have.ownProperty('foo').and.be.a.Function;

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should disable plugins', function (done) {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        foo: false
      }
    };

    loader(beyo, pluginsOptions).then(function (plugins) {
      plugins.should.not.have.ownProperty('foo');

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail with invalid alias', function () {
    var invalidPluginAliasses = [
      undefined, null, true, void 0, 0, 1, {}, [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidPluginAliasses, function (beyo, invalidPluginAlias) {
      beyo.once('pluginLoadError', function (evt) {
        evt.should.have.property('error').be.instanceOf(Error).and.have.ownProperty('message').startWith('Plugin map value must be a non-empty string');
      });

      return loader(beyo, {
        path: 'simple-app/plugins',
        plugins: {
          foo: invalidPluginAlias
        }
      }).then(function (plugins) {
        plugins.should.not.have.ownProperty('foo');
      });
    }, function (invalidPluginAlias) {
      return 'Invalid options value: ' + String(invalidPluginAlias);
    }).then(function (err) {
      done(err);
    });
  });

  it('should define alias', function (done) {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        foo: 'foo123'
      }
    };

    loader(beyo, pluginsOptions).then(function (plugins) {
      plugins.should.not.have.ownProperty('foo');
      plugins.should.have.ownProperty('foo123');
      plugins.should.have.ownProperty('bar');
      plugins.should.not.have.ownProperty('morePlugins.empty');
      plugins.should.have.ownProperty('morePlugins.buz');
      plugins['morePlugins.buz'].should.not.equal(plugins.bar).and.not.equal(plugins.foo123);

      beyo.__plugins.bar.should.be.true;
      beyo.__plugins.buz.should.be.true;
      beyo.__plugins.foo.should.be.true;
      beyo.__plugins.empty.should.be.true;

      done();
    }).catch(function (err) {
      done(err);
    });

  });

  it('should reject on invalid path', function (done) {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'some-invalid-path'
    };
    var eventFired = false;

    beyo.on('pluginsNotFound', function (evt) {
      evt.path.should.endWith(pluginsOptions.path);

      eventFired = true;
    });

    loader(beyo, pluginsOptions).then(function (plugins) {
      eventFired.should.be.true;

      done();
    }).catch(function (err) {
      done(err);
    });

  });

  describe('Plugin aliasses', function () {

    it('should throw error with two alias on different plugins', function (done) {
      var beyo = new BeyoMock();
      var pluginsOptions = {
        path: 'simple-app/plugins',
        plugins: {
          foo: 'test',
          bar: 'test'
        }
      };
      var hasError = false;

      beyo.on('pluginLoadConflict', function (evt) {
        evt.should.have.property('error').be.instanceOf(Error)
          .and.have.ownProperty('message').startWith('Duplicate plugin alias: test');

        hasError = true;
      });

      loader(beyo, pluginsOptions).then(function (plugins) {
        hasError.should.be.true;

        plugins.should.have.ownProperty('bar');
        plugins.should.have.ownProperty('test');
        plugins.bar.should.not.equal(plugins.test);

        done();
      }).catch(function (err) {
        done(err);
      });

    });

    it('should emit conflict on alias override', function (done) {
      var beyo = new BeyoMock();
      var pluginsOptions = {
        path: 'simple-app/plugins',
        plugins: {
          bar: 'foo'
        }
      };
      var plugins;
      var hasConflict = false;

      beyo.on('pluginLoadConflict', function (evt) {
        //evt.pluginName.should.equal('foo');

        hasConflict = true;
      });

      loader(beyo, pluginsOptions).then(function (plugins) {
        hasConflict.should.be.true;

        //plugins.should.have.ownProperty('bar');
        //plugins.should.have.ownProperty('foo');
        //plugins.bar.should.equal(plugins.foo);

        done();
      }).catch(function (err) {
        done(err);
      });

    });

    it('should NOT emit conflict on alias override', function (done) {
      var beyo = new BeyoMock();
      var pluginsOptions = {
        path: 'simple-app/plugins',
        plugins: {
          bar: 'foo',
          foo: 'my.meh'
        }
      };
      var plugins;
      var hasConflict = false;

      beyo.on('pluginLoadConflict', function (evt) {
        hasConflict = true;
      });

      loader(beyo, pluginsOptions).then(function (plugins) {
        hasConflict.should.be.false;

        plugins.should.not.have.ownProperty('bar');
        plugins.should.have.ownProperty('foo');

        plugins.should.have.ownProperty('my.meh');

        done();
      }).catch(done);
    });
  });

  describe('Plugins loader events', function () {

    var beyo = new BeyoMock();
    var moduleName = 'test' + Date.now();
    var pluginsOptions = {
      path: 'simple-app/plugins-ext',
      plugins: {
        bar: 'foo',
        'morePlugins.empty': 'bar',
        'morePlugins.buz': 'morePlugins.buz'
      }
    };
    var eventsFired = {};

    after(function (done) {
      loader(beyo, pluginsOptions).then(function (plugins) {
        Object.keys(eventsFired).should.have.length(4);

        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should emit `pluginLoad`', function () {
      beyo.on('pluginLoad', function (evt) {
        eventsFired['pluginLoad'] = true;
      });
    });
    it('should emit `pluginLoadConflict`', function () {
      beyo.on('pluginLoadConflict', function (evt) {
        eventsFired['pluginLoadConflict'] = true;
      });
    });
    it('should emit `pluginLoadError`', function () {
      beyo.on('pluginLoadError', function (evt) {
        eventsFired['pluginLoadError'] = true;
      });
    });
    it('should emit `pluginLoaded`', function () {
      beyo.on('pluginLoaded', function (evt) {
        eventsFired['pluginLoaded'] = true;
      });
    });

  });
});