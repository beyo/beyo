

describe('Beyo Application Framework', function () {

  var testPath = process.cwd();;

  var co = require('co');
  var Beyo;

  before(function () {
    // need to make this relative (?)
    process.chdir('test/fixtures/simple-app');

    Beyo = require('../../lib/beyo');
  });

  after(function () {
    process.chdir(testPath);
  });

  this.timeout(3000);

  describe('Test loading application', function () {

    var testBeyo;

    before(function () {
      testBeyo = new Beyo()
    });

    it('should initialize', function * () {
      testBeyo.isInitializing.should.be.false;
      testBeyo.isReady.should.be.false;

      yield testBeyo.init();

      testBeyo.isInitializing.should.be.false;
      testBeyo.isReady.should.be.true;

      // if the fixture was called, then `init` was invoked, and we should have an require function!
      testBeyo.require.should.be.a.Function;
    });

    it('should have loaded app', function () {
      testBeyo.app.should.equal('app');
    });

    it('should have processed post init handlers', function () {
      testBeyo.__postInitTestGenerator.should.be.true;
      testBeyo.__postInitTestThunk.should.be.true;
    });

    describe('Test plugins', function () {

      it('should return available plugins', function () {
        testBeyo.plugins.should.be.a.Function;
        testBeyo.plugins.available.should.be.an.Array;

        testBeyo.plugins.available.forEach(function (key) {
          testBeyo.plugins(key).should.be.a.Function;
          testBeyo.plugins(key)().should.be.true;
        });
      });

      it('should not allow modifying available plugin array', function () {
        (function () {
          testBeyo.plugins.available.push('test');
        }).should.throw();
      });

      it('should fail with invalid plugin key', function () {
        [
          undefined, true, false, null, void 0, -1, 0, 1, function () {}, {}, [], /./, ''
        ].forEach(function (invalidKey) {
          (function () { testBeyo.plugins(invalidKey); }).should.throw();
        });
      });

    });

    describe('Test Models', function () {

      it('should return available models', function () {
        testBeyo.models.should.be.a.Function;
        testBeyo.models.available.should.be.an.Array;

        testBeyo.models.available.forEach(function (key) {
          testBeyo.models(key);   // Note : undefined result, just check that we get it...
        });
      });

      it('should fail with invalid model key', function () {
        [
          undefined, true, false, null, void 0, -1, 0, 1, function () {}, {}, [], /./, '',
          'a/b/c'
        ].forEach(function (invalidKey) {
          (function () { testBeyo.models(invalidKey); }).should.throw();
        });
      });

      it('should fetch model even when no module specified', function () {
        testBeyo.models('test/Foo').should.be.equal(testBeyo.models('Foo'));
      });

    });

    describe('Test Services', function () {

      it('should return available services', function () {
        testBeyo.services.should.be.a.Function;
        testBeyo.services.available.should.be.an.Array;

        testBeyo.services.available.forEach(function (key) {
          testBeyo.services(key);   // Note : undefined result, just check that we get it...
        });
      });

      it('should fail with invalid service key', function () {
        [
          undefined, true, false, null, void 0, -1, 0, 1, function () {}, {}, [], /./, '',
          'a/b/c'
        ].forEach(function (invalidKey) {
          (function () { testBeyo.services(invalidKey); }).should.throw();
        });
      });

      it('should fetch model even when no module specified', function () {
        testBeyo.services('test/index').should.be.equal(testBeyo.services('index'));
      });

    });

  });

  describe('Test environment settings', function () {

    it('should allow changing value', function () {
      var testBeyo = new Beyo();

      testBeyo.env.should.equal('development');

      testBeyo.env = 'test';

      testBeyo.env.should.equal('test');
      process.env.NODE_ENV.should.equal(testBeyo.env);
    });

  });


});