

describe('Beyo Application Framework', function () {

  var testPath = process.cwd();;

  var co = require('co');
  var beyo;

  before(function () {
    process.chdir('test/fixtures/simple-app');

    beyo = require('../../lib/beyo');
  });

  after(function () {
    process.chdir(testPath);
  });

  this.timeout(3000);

  it('should load application', function (done) {
    var koa = require('koa');

    co(function * () {
      var testBeyo = yield beyo.initApplication();

      testBeyo.app.should.be.instanceof(koa);

      // if the fixture was called, then `init` was invoked, and we should have an appRequire function!
      testBeyo.appRequire.should.be.a.Function;

      testBeyo.__postInitTestGenerator.should.be.true;
      testBeyo.__postInitTestThunk.should.be.true;

    })(done);
  });



});