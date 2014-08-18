

var co = require('co');
var fs = require('co-fs');

var pathJoin = require('path').join;
var readline = require('readline');

var suspend = require('co-suspend');
var errorFactory = require('error-factory');

var Beyo = require(pathJoin(__dirname, '..', '..'));


var ArgumentException = errorFactory('beyo.ArgumentException');


/**
Wrap the given action with argument and options check. The action should
be a yieldable (generator, thunk, promise, etc.)

Arguments are values that are not defined in the command options. For example
a command defining no option would receive all values as arguments.

Note : everything after '--' will be given as arguments, not options.

The argument argCheck should be
*/
module.exports = function prepareCommandApp(argCheck, optionCheck, callback) {
  return function initCommandApp() {
    var args = Array.prototype.slice.call(arguments);
    var options = args.pop();
    var beyo;

    // init app
    co(function * () {
      if (argCheck instanceof Array) {
        if (argCheck && (args.length < argCheck.length)) {
          throw ArgumentException('Missing argument `' + argCheck[args.length] + '`');
        }
      } else if (argCheck !== null && typeof argCheck === 'object') {
        Object.keys(argCheck).forEach(function (arg, index) {
          if (args.length <= index) {
            if (argCheck[arg] === undefined) {
              throw ArgumentException('Missing argument `' + arg + '`');
            } else {
              args.push(argCheck[arg]);
            }
          } else {
            if (args[index] === undefined) {
              if (argCheck[arg] === undefined) {
                throw ArgumentException('Missing argument `' + arg + '`');
              } else {
                args[index] = argCheck[arg];
              }
            }
          }
        });
      } else if (argCheck) {
        throw ArgumentException('Invalid argument `argCheck`');
      }

      if (optionCheck) {
        optionCheck.forEach(function (arg) {
          if (!options[arg]) {
            throw ArgumentException('Missing `' + arg + '` flag');
          }
        });
      }

      beyo = new Beyo();

      // add prompt tools
      beyo.askUserInput = askUserInput;

      try {
        return yield callback(beyo, args, options);
      } catch (e) {
        beyo.logger.error(e.stack || e.message);
        return false;
      }
    })(function (err, code) {
      if (err instanceof ArgumentException) {
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


function * askUserInput(msg, choices) {
  var res;
  var marker = suspend();
  var reader = readline.createInterface(process.stdin, process.stdout);

  reader.question(msg, function (answer) {
    answer = answer.toLocaleLowerCase();
    if (typeof choices === 'string') {
      res = (choices.toLocaleLowerCase() === answer);
    } else if (choices instanceof Array) {
      res = choices.reduce(function (found, choice) {
        return (choice.toLocaleLowerCase() === answer) || found;
      }, false);
    } else {
      res = false;
    }
    marker.resume(null, res);
  });
  yield marker.wait(60000);

  return res;
}
