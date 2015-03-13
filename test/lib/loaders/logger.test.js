

describe('Test Logger Loader', function () {

  var loader = require(__root + '/lib/loaders/logger');
  var TestError = require('error-factory')('beyo.testing.TestError');

  this.timeout(1000);

  it('should fail when no options specified'/*, function () {
    try {
      yield loader();

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
  }*/);

 it('should fail with invalid options value'/*, function () {
    var invalidOptions = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidOptions.length; i < iLen; ++i) {
      try {
        yield loader(beyo, invalidOptions[i]);

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
  }*/);

  it('should load with typical configuration'/*, function () {
    //var EventEmitter = require('events').EventEmitter;

    var beyo = new BeyoMock();
    var options = {
      "levels": {
        "critical": 6,
        "error": 5,
        "warning": 4,
        "alert": 3,
        "notice": 2,
        "info": 1,
        "debug": 0
      },
      "colors": {
        "critical": "red",
        "error": "bold red",
        "warning": "yellow",
        "alert": "bold yellow",
        "notice": "bold green",
        "info": "green",
        "debug": "blue"
      },
      "level": "debug",
      "transports": {
        "console": {
          "colorize": true,
          "handleExceptions": true,
          "json": false,
          "level": "debug",
          "prettyPrint": true,
          "timestamp": false
        }
      },
      "exitOnError": false
    };

    var logger = yield loader(beyo, options);

    Object.keys(options.levels).forEach(function (level, i, levels) {
      logger.should.have.property(level).a.Function;
    });

    //logger.should.be.an.instanceOf(EventEmitter);
    [
      'on', 'addListener', 'removeListener', 'emit'
    ].forEach(function (property) {
      logger.should.have.property(property).a.Function;
    });
  }*/);

  it('should fail with invalid transports'/*, function () {
    var invalidTransports = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidTransports.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { transports: invalidTransports[i] });

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid transports: ' + String(invalidTransports[i]));
        }
      }
    }
  }*/);

  it('should fail with invalid transport class'/*, function () {
    var beyo = new BeyoMock();
    var options = {
      "transports": {
        "___SOME_INVALID_AND_SILLY_TRANSPORT___": {}
      }
    };

    try {
      yield loader(beyo, options);

      throw TestError(this.runnable().fullTitle());
    } catch (e) {
      if (e instanceof TestError) {
        throw e;
      } else {
        e.should.be.an.Error
          .and.have.property('message')
          .equal('Logger has no transport class: ___SOME_INVALID_AND_SILLY_TRANSPORT___');
      }
    }
  }*/);

  it('should load levels from default logger config'/*, function () {
    var beyo = new BeyoMock();
    var options = {
      "levels": "cli"
    };

    yield loader(beyo, options);
  }*/);

  it('should fail to load levels from invalid default logger config'/*, function () {
    var invalidLevels = [
      null, true, false, 0, 1, '', '***', [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidLevels.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { levels: invalidLevels[i] });

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid levels config string: ' + String(invalidLevels[i]));
        }
      }
    }
  }*/);

  it('should load colors from default logger config'/*, function () {
    var beyo = new BeyoMock();
    var options = {
      "colors": "syslog"
    };

    yield loader(beyo, options);
  }*/);

  it('should fail to load colors from invalid default logger config'/*, function () {
    var invalidLevels = [
      null, true, false, 0, 1, '', '***', [], /./, function () {}
    ];
    var beyo = new BeyoMock();

    for (var i = 0, iLen = invalidLevels.length; i < iLen; ++i) {
      try {
        yield loader(beyo, { colors: invalidLevels[i] });

        throw TestError(this.runnable().fullTitle());
      } catch (e) {
        if (e instanceof TestError) {
          throw e;
        } else {
          e.should.be.an.Error
            .and.have.property('message')
            .equal('Invalid colors config string: ' + String(invalidLevels[i]));
        }
      }
    }
  }*/);

  describe('Logger loader events', function () {

    var beyo = new BeyoMock();
    var eventsFired = {};

    /*
    after(function () {
      // no error...
      yield loader(beyo, {});

      // with error
      try {
        yield loader(beyo, { transports: null });
      } catch (e) {
        e.should.be.an.Error;
      }

      Object.keys(eventsFired).should.have.lengthOf(3);
    });
    */

    it('should emit `loggerLoad`'/*, function () {
      beyo.on('loggerLoad', function (evt) {
        eventsFired['loggerLoad'] = true;
      });
    }*/);
    it('should emit `loggerLoadError`'/*, function () {
      beyo.on('loggerLoadError', function (err, evt) {
        err.should.be.an.Error;

        eventsFired['loggerLoadError'] = true;
      });
    }*/);
    it('should emit `loggerLoadComplete`'/*, function () {
      beyo.on('loggerLoadComplete', function (evt) {
        evt.logger.should.exist;

        eventsFired['loggerLoadComplete'] = true;
      });
    }*/);

  });
});