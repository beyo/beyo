

describe('Test App Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/app');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(1000);

  it('should fail when no options specified', function (done) {
    should.allFailAsyncPromise([undefined], function () {
      return loader();
    }, function (value) {
      return 'No options specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid options value', function (done) {
    var invalidOptions = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidOptions, function (beyo, value) {
      return loader(beyo, value);
    }, function (value) {
      return 'Invalid options value: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with no path specified', function (done) {
    var invalidOptions = [
      {}
    ];

    should.allFailAsyncPromise(invalidOptions, function (beyo, value) {
      return loader(beyo, value);
    }, function () {
      return 'Application path not specified';
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid path value', function (done) {
    var invalidPaths = [
      undefined, null, true, false, void 0, 0, 1, {}, [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidPaths, function (beyo, value) {
      return loader(beyo, { path: value });
    }, function (value) {
      return 'Invalid path value: ' + String(value);
    }).then(function (err) {
      done(err);
    });
  });


  it('should laod app', function (done) {
    var beyo = new BeyoMock();
    var options = {
      path: 'simple-app/app'
    };
    var events = {};

    ['appLoad', 'appLoadError', 'appLoaded'].forEach(function (eventKey) {
      beyo.on(eventKey, function (evt) {
        events[eventKey] = true;
      });
    });

    loader(beyo, options).then(function (app) {
      app.should.have.ownProperty('__app').eql(beyo.__app);

      events.should.have.ownProperty('appLoad');
      events.should.have.ownProperty('appLoaded');
      events.should.not.have.ownProperty('appLoadError');

      done();
    }).catch(done);
  });


  it('should ignore missing app init module', function () {
    var beyo = new BeyoMock();
    var options = {
      path: 'simple-app/app'
    };
    var events = {};

    ['appLoad', 'appLoadError', 'appLoaded'].forEach(function (eventKey) {
      beyo.on(eventKey, function (evt) {
        events[eventKey] = true;
      });
    });

    loader(beyo, options).then(function (app) {
      should(app).be.undefined;

      events.should.have.ownProperty('appLoad');
      events.should.have.ownProperty('appLoaded');
      events.should.not.have.ownProperty('appLoadError');

      done();
    });
  });

  it('should not laod on error', function (done) {
    var beyo = new BeyoMock();
    var options = {
      path: 'simple-app/app-error'
    };
    var events = {};

    ['appLoad', 'appLoadError', 'appLoaded'].forEach(function (eventKey) {
      beyo.on(eventKey, function (evt) {
        events[eventKey] = true;
      });
    });

    loader(beyo, options).then(function (app) {
      throw TestError('Test failed');
    }).catch(function (err) {
      events.should.have.ownProperty('appLoad');
      events.should.not.have.ownProperty('appLoaded');
      events.should.have.ownProperty('appLoadError');

      done();
    });
  });

});