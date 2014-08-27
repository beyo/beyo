

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
      var callbackContext;

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
        optionCheck.forEach(function (flag) {
          if (!options[flag]) {
            throw ArgumentException('Missing `' + flag + '` flag');
          }
        });
      }

      beyo = new Beyo();

      bindOutputEvents(beyo, options);

      // create callback context
      callbackContext = {
        askUserInput: askUserInput
      };

      return yield callback.call(callbackContext, beyo, args, options);
    })(function (err, code) {
      if (err) {
        if (!options.quiet) {
          if (options.showStackTrace) {
            console.error('[*]', err.stack || err);
          } else {
            console.error('[*]', err.message || err);
          }
        }
        process.exit(-1);
      } else if (!(beyo && beyo.isListening)) {
        // only if a server has not been started at this point
        console.log();
        process.exit(code || 0);
      }
    });

  };

};


/**
User input function returning the users's choice.

Example usage:

    var usrInput;

    yield askUserInput('Hit ENTER to continue...', null, null, Infinity);
    userInput = yield askUserInput('What is your name?');
    userInput = yield askUserInput('Specify host:', null, 'localhost');
    userInput = yield askUserInput('Type OK to confirm', 'OK');
    userInput = yield askUserInput('Are you okay? [Yn]', ['yes', 'no'], 'y', 30000);

If defaultChoice is undefined, then whatever input will be returned, even empty
strings. If defaultChoice is NOT undefined, and the input is falsy (invalid or empty),
then defaultChoice is returned.

The default timeout is 60000. Pass Infinity to a limitless input. Upon timeout,
the defaultChoice value is returned, whatever it may be and the input is discarded.

@param {String} msg                         the input message
@param {String|Array} choices    (optional) the available user choice-s
@param {mixed} defaultChoice     (optional) return this value on invalid, or empty, user choice (default: undefined)
@param {Number} timeout          (optional) how long before the default answer is returned (default: 60000 (ms))
@return {mixed}                             the user input or default answer
*/
function * askUserInput(msg, choices, defaultChoice, timeout) {
  var marker = suspend();
  var reader = readline.createInterface(process.stdin, process.stdout);

  reader.question(msg.trim() + ' ', function (answer) {
    var choice;
    var answerLower = answer.trim().toLocaleLowerCase();

    if (typeof choices === 'string') {
      choice = (choices.toLocaleLowerCase() === answerLower) ? choices : defaultChoice;
    } else if (choices instanceof Array) {
      choice = choices.reduce(function (found, choice) {
        return (choice.trim().toLocaleLowerCase() === answerLower) ? choice : found;
      }, defaultChoice);
    } else {
      choice = answer.trim();

      if (!choice && (defaultChoice !== undefined)) {
        choice = defaultChoice;
      }
    }

    marker.resume(null, choice);
  });

  try {
    return yield marker.wait(timeout || 60000);
  } catch (e) {
    return defaultChoice;
  } finally {
    reader.close();
  }
}


/**
Recursively scan options to filter defined values.

@param {Object} options    the options received from commander.js
@param {Array} keys        the keys to detect in options
@return {Object}           the filtered options
*/
function detectOptions(options, keys, depth) {
  var opt;

  options = options || {};
  if (depth === undefined) {
    depth = Infinity;
  }

  if (options.parent && depth > 0) {
    opt = detectOptions(options.parent, keys, depth - 1);
  } else {
    opt = {};
  }

  keys.forEach(function (key) {
    if (key in options) {
      opt[key] = options[key];
    }
  });

  return opt;
}


/**
Listen to the various Beyo events and output feedback to stdout
*/
function bindOutputEvents(beyo, options) {
  options = detectOptions(options, ['verbose', 'showStackTrace', 'quiet']);

  // config
  beyo.on('configLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Config]', 'Loading', evt.file);
    }
  });
  beyo.on('configLoadConflict', function (keyPath, src, dst, evt) {
    if (!options.quiet) {
      console.warn('[Config]', 'Conflict in config key', '"' + evt.keyPath + '"', 'in', evt.file, src, dst);
    }
  });
  beyo.on('configLoadError', function (err, evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Config]', err.stack || err);
      } else {
        console.error('[Config]', err.message || err);
      }
    }
  });
  //beyo.on('configLoadComplete', function (evt) { });


}