

describe('Test File Processor', function () {

  var fileProc = require('../../../lib/io/file-processor');
  var TestError = require('error-factory')('beyo.testing.TestError');
  var createFiles = fileProc.createFiles;
  var tmpDir;

  before(function (done) {
    var path = require('path');
    var tmp = require('tmp');
    var beyo = new BeyoMock();

    tmp.setGracefulCleanup();
    tmp.dir({ dir: beyo.rootPath, prefix: 'beyoTest_', unsafeCleanup: true }, function _tempDirCreated(err, tmpPath) {
      if (err) throw err;

      tmpDir = path.relative(beyo.rootPath, tmpPath);
      done();
    });
  });

  it('should fail when no options specified', function * () {
    try {
      yield createFiles();

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
        yield createFiles(beyo, invalidOptions[i]);

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
      yield createFiles(beyo, {});

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Path not specified');
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
        yield createFiles(beyo, { path: invalidPaths[i]});

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

  it('should fail with invalid resource path value', function * () {
    var invalidPaths = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidPaths.length; i < iLen; ++i) {
      try {
        yield createFiles(beyo, { path: tmpDir, files: {}, resourcePath: invalidPaths[i]});

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid resource path value: ' + String(invalidPaths[i]));
        }
      }
    }
  });

  it('should fail with no files specified', function * () {
    var beyo = new BeyoMock();

    try {
      yield createFiles(beyo, { path: 'some/path' });

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Files not specified');
      }
    }
  });

  it('should fail with invalid files value', function * () {
    var invalidFiles = [
      undefined, null, true, false, void 0, 0, 1, [], /./, function () {}, '', 'abc'
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidFiles.length; i < iLen; ++i) {
      try {
        yield createFiles(beyo, { path: 'some/path', files: invalidFiles[i]});

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid files value: ' + String(invalidFiles[i]));
        }
      }
    }
  });

  it('should fail with invalid tokens value', function * () {
    var invalidTokens = [
      undefined, null, true, false, void 0, 0, 1, [], /./, function () {}, '', 'abc'
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidTokens.length; i < iLen; ++i) {
      try {
        yield createFiles(beyo, { path: 'some/path', files: {}, tokens: invalidTokens[i] });

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid tokens value: ' + String(invalidTokens[i]));
        }
      }
    }
  });

  it('should create basic structure', function * () {
    var path = require('path');
    var beyo = new BeyoMock();
    var completeEvent = false;
    var content;

    beyo.on('installFileComplete', function (evt) {
      evt.should.have.ownProperty('file').equal('foo/bar.js');
      evt.should.have.ownProperty('fileIndex').equal(0);
      evt.should.have.ownProperty('files').be.an.Array.with.lengthOf(1);
      evt.should.have.ownProperty('options').be.an.Object; // almost equal to the one sent to createFiles...

      completeEvent = true;
    });

    beyo.on('installFileError', function (err, evt) {
      console.error(err);
    });

    yield createFiles(beyo, {
      path: tmpDir,
      files: {
        'foo/bar.js': 'module.exports = "Hello World!";'
      }
    });

    completeEvent.should.be.true;

    content = require(path.join(beyo.rootPath, tmpDir, 'foo/bar.js'));

    content.should.equal('Hello World!');
  });

  it('should fail with file path outside base path', function * () {
    var beyo = new BeyoMock();

    try {
      yield createFiles(beyo, {
        path: tmpDir,
        files: {
          'foo/../../bar.txt': 'SHOULD NOT SEE THIS'
        }
      });

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Invalid path: foo/../../bar.txt');
      }
    }

  });

  it('should fail streaming external file without resource path', function * () {
    var beyo = new BeyoMock();

    try {
      yield createFiles(beyo, {
        path: tmpDir,
        files: {
          'foo.json': '@install/test-tokens.json'
        }
      });

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Resource path not specified: install/test-tokens.json');
      }
    }
  });

  it('should stream external files', function * () {
    var path = require('path');
    var beyo = new BeyoMock();
    var originalContent;
    var content;

    yield createFiles(beyo, {
      path: tmpDir,
      resourcePath: beyo.rootPath,
      files: {
        'foo.json': '@install/test-tokens.json'
      },
      tokens: {
        key: 'foobar',
        key1: 1,
        key2: 2,
        key3: 3,
        key4: 4
      }
    });

    originalContent = beyo.require(path.join('install', 'test-tokens.json'));
    content = beyo.require(path.join(tmpDir, 'foo.json'));

    originalContent.should.not.eql(content);

    originalContent.should.have.ownProperty('%key');
    content.should.not.have.ownProperty('%key');
    originalContent.should.not.have.ownProperty('foobar');
    content.should.have.ownProperty('foobar');
    originalContent['%key'].should.equal(content['foobar']);

    originalContent['test'].should.not.equal(content['test']);
    originalContent['test'].should.equal('Lorem ipsum dolor sit amet, %key1%key2 %key3-%key4 consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus %NOKEY sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosq.');
    content['test'].should.equal('Lorem ipsum dolor sit amet, 12 3-4 consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus %NOKEY sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosq.');
  });

  it('should stream external files (no tokens)', function * () {
    var path = require('path');
    var beyo = new BeyoMock();
    var originalContent;
    var content;

    beyo.on('installFileError', function (err, evt) {
      console.error(err);
    });

    yield createFiles(beyo, {
      path: tmpDir,
      resourcePath: beyo.rootPath,
      files: {
        'foo.json': '@install/test-tokens.json'
      }
    });

    originalContent = beyo.require(path.join('install', 'test-tokens.json'));
    content = beyo.require(path.join(tmpDir, 'foo.json'));

    content.should.eql(originalContent);
  });

  it('should emit error', function * () {
    var path = require('path');
    var beyo = new BeyoMock();
    var errorEvent = 0;

    beyo.on('installFileError', function (err, evt) {
      err.should.be.an.Error;

      errorEvent = errorEvent + 1;
    });
    beyo.on('installFileComplete', function (evt) {
      console.log("** INSTALL FILE", evt);
    });

    yield createFiles(beyo, {
      path: tmpDir,
      resourcePath: beyo.rootPath,
      files: {
        'invalid': '@invalid/resource/path/__unknown/file',
        'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789': '@install/test-tokens.json'
      }
    });

    errorEvent.should.be.equal(2);
  });


  describe('Test Token Replacement', function () {

    it('should replace tokens', function * () {
      var path = require('path');
      var beyo = new BeyoMock();
      var content;

      yield createFiles(beyo, {
        path: tmpDir,
        files: {
          'tokens/hello.json': '{ "greetings": "Hello %title %name! 100%abc" }'
        },
        tokens: {
          title: 'Mr.',
          name: 'Smith'
        }
      });

      content = require(path.join(beyo.rootPath, tmpDir, 'tokens/hello.json'));

      content.should.eql({ 'greetings': 'Hello Mr. Smith! 100%abc' });
    });

  });

});