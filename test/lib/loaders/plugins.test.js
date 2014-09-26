

describe('Test Plugins Loader', function () {

  var loader = require(__root + '/lib/loaders/plugins');
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
          .equal('Plugins path not specified');
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

  it('should fail with invalid plugins value', function * () {
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
  });

  it('should load plugins', function * () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins'
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.have.ownProperty('foo').and.be.a.Function;

  });

  it('should disable plugins', function * () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        foo: false
      }
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.not.have.ownProperty('foo');

  });

  it('should fail with invalid alias', function * () {
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
      err.should.be.an.Error.and.have.ownProperty('message').startWith('Plugin map value must be a string');

      hasError = true;
    });

    for (var i = 0, iLen = invalidPluginAliasses.length; i < iLen; ++i) {
      hasError = false;
      pluginsOptions.plugins.foo = invalidPluginAliasses[i];

      plugins = yield loader(beyo, pluginsOptions);

      hasError.should.be.true;
      plugins.should.not.have.ownProperty('foo');
    }
  });

  it('should define alias', function * () {
    var beyo = new BeyoMock();
    var pluginsOptions = {
      path: 'simple-app/plugins',
      plugins: {
        foo: 'bar'
      }
    };
    var plugins = yield loader(beyo, pluginsOptions);

    plugins.should.have.ownProperty('foo');
    plugins.should.have.ownProperty('bar');
    plugins.foo.should.equal(plugins.bar);

  });

});