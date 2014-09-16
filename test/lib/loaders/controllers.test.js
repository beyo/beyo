

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

    // TODO : add controller that does not return anything

  });

  it('should fail if invalid options is specified', function * () {
    var beyo = new BeyoMock();
    var context = {};
    var options = [
      undefined, null, false, true, void 0, 0, 1, [], /./, function () {}, '', 'abc'
    ];
    var err;

    for (var i = 0, iLen = options.length; i < iLen; ++i) {
      err = null;

      try {
        yield loader(beyo, options[i]);
      } catch (e) {
        err = e;
      } finally {
        err.should.be.an.Error;
      }
    }
  });

  it('should fail if context is not specified or invalid', function * () {
    var beyo = new BeyoMock();
    var context = {};
    var options = {
      path: 'simple-app/app/modules/test/controllers',
      moduleName: 'test'
    };
    var context = [
      undefined, null, false, true, void 0, 0, 1, [], /./, function () {}, '', 'abc'
    ];
    var err;

    for (var i = 0, iLen = context.length; i < iLen; ++i) {
      err = null;
      try {
        options.context = context[i];

        yield loader(beyo, options);
      } catch (e) {
        err = e;
      } finally {
        err.should.be.an.Error;
      }
    }
  });

  it('should fail if moduleName is not specified or invalid');

  it('should fail if path is not specified or invalid');


  describe('Controller loader events', function () {

    var beyo = new BeyoMock();
    var context = {};
    var options = {
      path: 'simple-app/app/modules/test/controllers',
      moduleName: 'test',
      context: context
    };
    var controllers;
    var eventsFired = {};

    after(function * () {
      controllers = yield loader(beyo, options);

      Object.keys(eventsFired).should.have.lengthOf(3);

      controllers.should.have.ownProperty('index').and.equal('index');
    });

    it('should emit `controllerLoad`', function () {
      beyo.on('controllerLoad', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoad'] = true;
      });
    });
    it('should emit `controllerLoadError`', function () {
      beyo.on('controllerLoadError', function (err, evt) {
        err.should.be.an.Error;
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoadError'] = true;
      });
    });
    it('should emit `controllerLoadComplete`', function () {
      beyo.on('controllerLoadComplete', function (evt) {
        evt.moduleName.should.equal(options.moduleName);

        eventsFired['controllerLoadComplete'] = true;
      });
    });

  });
});