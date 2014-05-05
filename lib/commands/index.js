
var errorFactory = require('error-factory');

var beyo = require('../..');
var co = require('co');

var fs = require('co-fs');
var pathJoin = require('path').join;

var EventEmitter = require('events').EventEmitter;

var ArgumentError = errorFactory('beyo.ArgumentError');


module.exports = function prepareCommandApp(argCheck, optionCheck, callback) {
  return function initCommandApp() {
    var args = Array.prototype.slice.call(arguments);
    var options = args.pop();

    // init app
    co(function * () {

      if (argCheck instanceof Array) {
        if (argCheck && (args.length < argCheck.length)) {
          throw ArgumentError('Missing argument `' + argCheck[args.length] + '`');
        }
      } else if (argCheck !== null && typeof argCheck === 'object') {
        Object.keys(argCheck).forEach(function (arg, index) {
          if (argCheck[arg] === undefined) {
            throw ArgumentError('Missing argument `' + arg + '`');
          } else if (args.length <= index) {
            args.push(argCheck[arg]);
          }
        });
      }

      if (optionCheck) {
        optionCheck.forEach(function (arg) {
          if (!options[arg]) {
            throw ArgumentError('Missing `' + arg + '` argument');
          }
        });
      }

      if (yield fs.exists(pathJoin(beyo.appRoot, 'index.js'))) {
        beyo.events.on('configLoaded', function (evt) {
          if (evt.config.plugins) {
            delete evt.config.plugins['services'];
          }
        });
        beyo.events.once('pluginsLoadComplete', function (evt) {
          evt.context.services = new EventEmitter();
        });

        yield require(beyo.appRoot)(beyo);

        return yield callback.apply(beyo, args.concat(options));

      } else {
        throw "Application not found! Did you forget to initialize it?\n" +
              "Type `beyo init` to create a new application.\n";
      }
    })(function (err, code) {
      if (err instanceof ArgumentError) {
        (beyo && beyo.logger || console).log('error', err.message, "\n");
        process.exit(-1);
      } else if (err) {
        (beyo && beyo.logger || console).log('error', err.stack || err);
        process.exit(-1);
      } else {
        console.log();
        process.exit(code || 0);
      }
    });

  };

};
