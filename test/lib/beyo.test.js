

describe('Beyo Application Framework', function () {

  var testPath = process.cwd();;

  var co = require('co');
  var Beyo;

  before(function () {
    process.chdir('test/fixtures/simple-app');

    Beyo = require('../../lib/beyo');
  });

  after(function () {
    process.chdir(testPath);
  });

  this.timeout(3000);

  it('should load application', function (done) {

    co(function * () {
      var testBeyo = new Beyo();

      testBeyo.isInitializing.should.be.false;
      testBeyo.isReady.should.be.false;

      yield testBeyo.init();

      testBeyo.isInitializing.should.be.false;
      testBeyo.isReady.should.be.true;
      //testBeyo.app.should.be.???

      // if the fixture was called, then `init` was invoked, and we should have an appRequire function!
      testBeyo.appRequire.should.be.a.Function;

      testBeyo.__postInitTestGenerator.should.be.true;
      testBeyo.__postInitTestThunk.should.be.true;

    })(done);
  });



});