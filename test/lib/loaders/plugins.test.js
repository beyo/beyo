

describe('Test Plugins Loader', function () {

  var loader = require(__root + '/lib/loaders/plugins');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(1000);

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
          .equal('Plugins path not specified');
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

  it('should fail with invalid plugins value'/*, function () {
    var invalidPlugins = [
      undefined, null, true, false, void 0, 0, 1, '', 'abc', '0', '1', [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidPlugins.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { path: 'simple-app/plugins', plugins: invalidPlugins[i] });

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid plugins map value: ' + String(invalidPlugins[i]));
        }
      }
    }
  }*/);

  it('should load plugins'/*, function () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins'
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.have.ownProperty('foo').and.be.a.Function;

  }*/);

  it('should disable plugins'/*, function () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        foo: false
      }
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.not.have.ownProperty('foo');

  }*/);

  it('should fail with invalid alias'/*, function () {
    var invalidPluginAliasses = [
      undefined, null, true, void 0, 0, 1, {}, [], /./, function () {}
    ];
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {}
    };
    var hasError;
    var plugins;

    beyo.on('pluginLoadError', function (err, evt) {
      err.should.be.an.Error.and.have.ownProperty('message').startWith('Plugin map value must be a non-empty string');

      hasError = true;
    });

    for (var i = 0, iLen = invalidPluginAliasses.length; i < iLen; ++i) {
      hasError = false;
      pluginsOptions.plugins.foo = invalidPluginAliasses[i];

      plugins = yield loader(beyo, pluginsOptions);

      hasError.should.be.true;
      plugins.should.not.have.ownProperty('foo');
    }
  }*/);

  it('should define alias'/* , function () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        foo: 'foo123'
      }
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.have.ownProperty('foo');
    plugins.should.have.ownProperty('foo123');
    plugins.should.have.ownProperty('bar');
    plugins.should.not.have.ownProperty('morePlugins.empty');
    plugins.should.have.ownProperty('morePlugins.buz');
    plugins.foo.should.equal(plugins.foo123).and.not.equal(plugins.bar);
    plugins['morePlugins.buz'].should.not.equal(plugins.bar).and.not.equal(plugins.foo);

    beyo.__plugins.bar.should.be.true;
    beyo.__plugins.buz.should.be.true;
    beyo.__plugins.foo.should.be.true;
    beyo.__plugins.empty.should.be.true;

  }*/);

  it('should return nothing on invalid path'/*, function () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'some-invalid-path'
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.eql({});
  }*/);

  describe('Plugin aliasses', function () {

    it('should throw error with two alias on different plugins'/*, function () {
      var beyo = new BeyoMock();
      var pluginsOptions = {
        path: 'simple-app/plugins',
        plugins: {
          foo: 'test',
          bar: 'test'
        }
      };
      var plugins;
      var hasError = false;

      beyo.on('pluginLoadError', function (err, evt) {
        err.should.be.an.Error;
        err.message.should.equal('Duplicate plugin alias: test');

        hasError = true;
      });

      plugins = yield loader(beyo, pluginsOptions);

      hasError.should.be.true;

      plugins.should.have.ownProperty('bar');
      plugins.should.have.ownProperty('test');
      plugins.bar.should.equal(plugins.test);
    }*/);

    it('should emit conflict on alias override'/*, function () {
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
        evt.pluginName.should.equal('foo');
        hasConflict = true;
      });

      plugins = yield loader(beyo, pluginsOptions);

      hasConflict.should.be.true;

      plugins.should.have.ownProperty('bar');
      plugins.should.have.ownProperty('foo');
      plugins.bar.should.equal(plugins.foo);

    }*/);

    it('should NOT emit conflict on alias override'/*, function () {
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

      plugins = yield loader(beyo, pluginsOptions);

      hasConflict.should.be.false;

      plugins.should.have.ownProperty('bar');
      plugins.should.have.ownProperty('foo');
      plugins.bar.should.equal(plugins.foo);

      plugins.should.have.ownProperty('my.meh');

    }*/);
  });

  describe('Plugins loader events', function () {

    var beyo = new BeyoMock();
    var moduleName = 'test' + Date.now();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        bar: 'foo',
        'morePlugins.empty': 'bar',
        'morePlugins.buz': 'morePlugins.buz'
      }
    };
    var plugins;
    var eventsFired = {};

    /*
    after(function () {
      plugins = yield loader(beyo, pluginsOptions);

      Object.keys(eventsFired).should.have.lengthOf(4);

      // plugins...
    });
    */

    it('should emit `pluginLoad`'/*, function () {
      beyo.on('pluginLoad', function (evt) {
        eventsFired['pluginLoad'] = true;
      });
    }*/);
    it('should emit `pluginLoadConflict`'/*, function () {
      beyo.on('pluginLoadConflict', function (key, src, dest, evt) {
        //key.should.equal('conflictKey');
        eventsFired['pluginLoadConflict'] = true;
      });
    }*/);
    it('should emit `pluginLoadError`'/*, function () {
      beyo.on('pluginLoadError', function (err, evt) {
        err.should.be.an.Error;
        eventsFired['pluginLoadError'] = true;
      });
    }*/);
    it('should emit `pluginLoadComplete`'/*, function () {
      beyo.on('pluginLoadComplete', function (evt) {
        eventsFired['pluginLoadComplete'] = true;
      });
    }*/);

  });
});