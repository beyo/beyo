

describe('Test Module Context', function () {

  var moduleContext = require('../../../lib/util/module-context');
  var should = require('should');


  it('should fail with no specified module', function () {
    (function () { moduleContext(); }).should.throw('No module specified');
  });

  it('should fail with invalid module', function () {
    [
      undefined, null, false, true, void 0,
      -1, 0, 1, '', '-1', '0', '1',
      function () {}, /./i, []
    ].forEach(function (invalidModule) {
      (function () { moduleContext(invalidModule); }).should.throw('Invalid module argument');
    });
  });

  it('should fail when no name is provided for the specified module', function () {
    (function () { moduleContext({}); }).should.throw('Module has no name');
  });

  it('should create valid isntance', function () {
    var module = {
      name: 'test'
    };
    var config = {
      foo: {
        bar: {
          buz: {
            meh: 'Hello World!'
          }
        }
      }
    };

    var ctx = moduleContext(module, config);

    ctx.constructor.name.should.equal('ModuleContext');

    ctx.should.have.ownProperty('_module').equal(module);
    ctx.should.have.ownProperty('_config').equal(config);
    ctx.should.have.ownProperty('config').be.a.Function;

    ctx.config('foo.bar.buz.meh').should.equal('Hello World!');
  });

  it('should ignore invalid config argument', function () {
    var module = {
      name: 'test'
    };

    var ctx = moduleContext(module);

    ctx.constructor.name.should.equal('ModuleContext');

    ctx.should.have.ownProperty('_module').equal(module);
    ctx.should.have.ownProperty('_config').and.be.an.Object.eql({});
    ctx.should.have.ownProperty('config').be.a.Function;

    should(ctx.config('foo.bar.buz.meh')).be.undefined;
  });

});