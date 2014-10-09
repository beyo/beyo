

describe('Test File Processor', function () {

  var fileProc = require('../../../lib/io/file-processor');
  var TestError = require('error-factory')('beyo.testing.TestError');


  describe('Test createFiles', function () {

    var createFiles = fileProc.createFiles;

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

    it('should fail with no fileDirectives specified', function * () {
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
            .equal('File directives not specified');
        }
      }
    });

    it('should fail with invalid fileDirectives value', function * () {
      var invalidFileDirectives = [
        undefined, null, true, false, void 0, 0, 1, [], /./, function () {}, '', 'abc'
      ];
      var beyo = new BeyoMock();

      for (var i = 0, iLen = invalidFileDirectives.length; i < iLen; ++i) {
        try {
          yield createFiles(beyo, { path: 'some/path', fileDirectives: invalidFileDirectives[i]});

          throw TestError(this.runnable().fullTitle());
        } catch (e) {
          if (e instanceof TestError) {
            throw e;
          } else {
            e.should.be.an.Error
              .and.have.property('message')
              .equal('Invalid file directives value: ' + String(invalidFileDirectives[i]));
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
          yield createFiles(beyo, { path: 'some/path', fileDirectives: {}, tokens: invalidTokens[i] });

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

  });

});