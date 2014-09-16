

describe('Test Controllers Loader', function () {

  var loader = require(__root + '/lib/loaders/controllers');


  it('should load controllers', function * () {
    var beyo = new BeyoMock();
    var context = {};
    var options = {
      path: 'simple-app/app/modules/test/controllers',
      moduleName: 'test',
      context: context
    };
    var controllers = yield loader(beyo, options);

    beyo.should.have.ownProperty('__controllers');
    beyo.__controllers.should.have.ownProperty('index').and.be.true;

    context.should.have.ownProperty('__controllers');
    context.__controllers.should.have.ownProperty('index').and.be.true;

    controllers.should.have.ownProperty('index').and.equal('index');
  });


});