

describe('Test Logger Loader', function () {

  var should = require('should');
  var loader = require(__root + '/lib/loaders/logger');
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

  it('should fail with invalid options value', function () {
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

  it('should load with typical configuration', function (done) {
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

    loader(beyo, options).then(function (logger) {
      Object.keys(options.levels).forEach(function (level, i, levels) {
        logger.should.have.property(level).a.Function;
      });

      //logger.should.be.an.instanceOf(EventEmitter);
      [
        'on', 'addListener', 'removeListener', 'emit'
      ].forEach(function (property) {
        logger.should.have.property(property).a.Function;
      });

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail with invalid transports', function (done) {
    var invalidTransports = [
      null, true, false, 0, 1, '', 'abc', [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidTransports, function (beyo, transport) {
      return loader(beyo, { transports: transport });
    }, function (transport) {
      return 'Invalid transports: ' + String(transport);
    }).then(function (err) {
      done(err);
    });
  });

  it('should fail with invalid transport class', function (done) {
    var beyo = new BeyoMock();
    var options = {
      "transports": {
        "___SOME_INVALID_AND_SILLY_TRANSPORT___": {}
      }
    };

    try {
      loader(beyo, options).then(function (logger) {
        done(TestError('Failed'));
      });
    } catch (e) {
      e.should.be.an.Error
        .and.have.property('message')
        .equal('Logger has no transport class: ___SOME_INVALID_AND_SILLY_TRANSPORT___');

      done();
    }
  });

  it('should load levels from default logger config', function (done) {
    var beyo = new BeyoMock();
    var options = {
      "levels": "cli"
    };

    loader(beyo, options).then(function (logger) {

      logger.should.have.property('levels').eql({
        silly: 0,
        input: 1,
        verbose: 2,
        prompt: 3,
        debug: 4,
        info: 5,
        data: 6,
        help: 7,
        warn: 8,
        error: 9
      });

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail to load levels from invalid default logger config', function (done) {
    var invalidLevels = [
      null, true, false, 0, 1, '', '***', [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidLevels, function (beyo, invalidLevel) {
      return loader(beyo, { levels: invalidLevel });
    }, function (invalidLevel) {
      return 'Invalid levels config string: ' + String(invalidLevel);
    }).then(function (err) {
      done(err);
    });
  });

  it('should load colors from default logger config', function (done) {
    var beyo = new BeyoMock();
    var options = {
      "colors": "syslog"
    };

    loader(beyo, options).then(function (logger) {

      // TODO : test colors

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail to load colors from invalid default logger config', function (done) {
    var invalidColors = [
      null, true, false, 0, 1, '', '***', [], /./, function () {}
    ];

    should.allFailAsyncPromise(invalidColors, function (beyo, invalidColor) {
      return loader(beyo, { colors: invalidColor });
    }, function (invalidColor) {
      return 'Invalid colors config string: ' + String(invalidColor);
    }).then(function (err) {
      done(err);
    });
  });

  describe('Logger loader events', function () {

    var beyo = new BeyoMock();
    var eventsFired = {};

    after(function (done) {
      try {
        loader(beyo, { transports: null });

        done(TestError('Failed'));
      } catch (e) {
        e.should.be.an.Error;
      }

      loader(beyo, {}).then(function () {
        Object.keys(eventsFired).should.have.lengthOf(3);

        done();
      });
    });

    it('should emit `loggerLoad`', function () {
      beyo.on('loggerLoad', function (evt) {
        eventsFired['loggerLoad'] = true;
      });
    });
    it('should emit `loggerLoadError`', function () {
      beyo.on('loggerLoadError', function (evt) {
        evt.error.should.be.an.Error;

        eventsFired['loggerLoadError'] = true;
      });
    });
    it('should emit `loggerLoaded`', function () {
      beyo.on('loggerLoaded', function (evt) {
        evt.logger.should.exist;

        eventsFired['loggerLoaded'] = true;
      });
    });

  });
});