

describe('Test Services Loader', function () {

  var loader = require(__root + '/lib/loaders/app');
  var should = require('should');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(500);

  it('should fail when no options specified', function (done) {
    try {
      loader().then(function (app) {
        done(TestError('Failed'));
      });
    } catch (err) {
      err.should.be.an.Error
        .and.have.property('message')
        .equal('No options specified');

      done();
    }
  });

  it('should fail with invalid options value', function (done) {
    var testName = this.runnable().fullTitle();
    var p = [];
    var invalidOptions = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];
    var invalidCount = 0;
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidOptions.length; i < iLen; ++i) {
      try {
        p.push(loader(beyo, invalidOptions[i]));
      } catch (e) {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Invalid options value: ' + String(invalidOptions[i]));

        ++invalidCount;
      }
    }

    Promise.all(p).then(function () {
      invalidCount.should.be.equal(invalidOptions.length);

      done();
    });
  });

  it('should fail with no path specified'/*, function () {
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
          .equal('Application path not specified');
      }
    }
  }*/);

  it('should fail with invalid path value'/*, function () {
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
  }*/);


  it('should laod app'/*, function () {
    var beyo = new BeyoMock();
    var options = {
      path: 'simple-app/app'
    };
    var app;
    var events = {};

    ['appLoad', 'appLoadError', 'appLoadComplete'].forEach(function (eventKey) {
      beyo.on(eventKey, function (evt) {
        events[eventKey] = true;
      });
    });

    app = yield loader(beyo, options);

    app.should.equal('app');

    events.should.have.ownProperty('appLoad');
    events.should.have.ownProperty('appLoadComplete');
    events.should.not.have.ownProperty('appLoadError');
  }*/);


  it('should ignore missing app init module'/*, function () {
    var beyo = new BeyoMock();
    var options = {
      path: 'simple-app/app'
    };
    var app;
    var events = {};

    ['appLoad', 'appLoadError', 'appLoadComplete'].forEach(function (eventKey) {
      beyo.on(eventKey, function (evt) {
        events[eventKey] = true;
      });
    });

    app = yield loader(beyo, options);

    should(app).be.undefined;

    events.should.have.ownProperty('appLoad');
    events.should.have.ownProperty('appLoadComplete');
    events.should.not.have.ownProperty('appLoadError');
  }*/);

  it('should not laod on error'/*, function () {
    var beyo = new BeyoMock();
    var options = {
      path: 'simple-app/app-error'
    };
    var app;
    var events = {};

    ['appLoad', 'appLoadError', 'appLoadComplete'].forEach(function (eventKey) {
      beyo.on(eventKey, function (evt) {
        events[eventKey] = true;
      });
    });

    app = yield loader(beyo, options);

    should(app).be.undefined;

    events.should.have.ownProperty('appLoad');
    events.should.not.have.ownProperty('appLoadComplete');
    events.should.have.ownProperty('appLoadError');
  }*/);

});