
const BEYO_CONFIG = './beyo.json';


var path = require('path');
var readline = require('readline');
var fs = require('fs');
var errorFactory = require('error-factory');

var Beyo = require(path.join(__dirname, '..', '..', 'lib', 'beyo'));


var ArgumentException = errorFactory('beyo.ArgumentException');


/**
Wrap the given action with argument and options check.

Arguments are values that are not defined in the command options. For example
a command defining no option would receive all values as arguments.

Note : everything after '--' will be given as arguments, not options.

The argument argCheck should be an array or object. If an array, it should be
an ordered list in which comment-line arguments should be provided. Failing to
provide the number of arguments in argCheck will generate an error. If an object,
the key/value pair will be iterated in declaring order in the same fashion as
if argCheck was an array, but if the value is undefined, it is used as default
value in case the argument is not provided from the command-line.

The argument optionCheck should be an array of options that must be provided
from the command-line. Unlike argCheck, optionCheck may not be an object.

The argument callback is a function that will be invoked with three (3)
arguments; the Beyo instance, the command-line arguments, and the options set.
The function's context provides different tools to help interact with the user.

Note : currently, only one tool is provided: askUserInput

The callback function should return a promise, which should resolve for a normal
and clean program termination, or be rejected on error for quick ending.

@param {Array|Object} argCheck
@param {Array} optionCheck
@param {Function} callback

@return {Function}
*/
module.exports = function prepareCommandApp(argCheck, optionCheck, callback) {
  return function initCommandApp() {
    var args = Array.prototype.slice.call(arguments);
    var options = detectOptions(args.pop(), ['verbose', 'showStackTrace', 'quiet']);
    var callbackContext;
    var beyo;

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

    beyo = new Beyo(getInstanceOptions());

    // create callback context
    callbackContext = {
      askUserInput: askUserInput
    };

    return callback.call(callbackContext, beyo, args, options).then(function (code) {
      if (!options.quiet) {
        console.log();  // empty line
      }
      process.exit(code || 0);
    }).catch(function (err) {
      if (!options.quiet) {
        if (options.showStackTrace) {
          console.error('[*]', err.stack || err);
        } else {
          console.error('[*]', err.message || err);
        }
        if (options.verbose && err.messageData) {
          if (err.messageData.error) {
            console.error('[*]', 'Error data', err.messageData.error.stack);
          } else {
            console.error('[*]', 'Error data', JSON.stringify(err.messageData, null, 2));
          }
        }
        console.log();
      }
      process.exit(-1);
    });
  };

};


/**
User input function returning the users's choice.

Example usage:

    var usrInput;

    askUserInput('Hit ENTER to continue...', null, null, Infinity).then(function (answer) { ... });
    askUserInput('What is your name?').then(function (answer) { ... });
    askUserInput('Specify host:', null, 'localhost').then(function (answer) { ... });
    askUserInput('Type OK to confirm', 'OK').then(function (answer) { ... });
    askUserInput('Are you okay? [Yn]', ['yes', 'no'], 'y', 30000).then(function (answer) { ... });

If defaultChoice is undefined, then whatever input will be returned, even empty
strings. If defaultChoice is NOT undefined, and the input is falsy (invalid or empty),
then defaultChoice is returned.

The default timeout is 60000. Pass Infinity to a limitless input. Upon timeout,
the defaultChoice value is returned, whatever it may be and the input is discarded.

TODO : validate and test

@param {String} msg                         the input message
@param {String|Array} choices    (optional) the available user choice-s
@param {mixed} defaultChoice     (optional) return this value on invalid, or empty, user choice (default: undefined)
@param {Number} timeout          (optional) how long before the default answer is returned (default: 60000 (ms))
@return {mixed}                             the user input or default answer
*/
function askUserInput(msg, choices, defaultChoice, timeout) {
  var reader = readline.createInterface(process.stdin, process.stdout);
  var promise = new Promise(function (resolve, reject) {
    var timeoutHandler;
    try {
      timeoutHandler = setTimeout(function () {
        timeoutHandler = undefined;
        reader.close();
      }, timeout);

      reader.question(msg.trim() + ' ', function (answer) {
        var choice;
        var answerLower = answer.trim().toLocaleLowerCase();

        clearTimeout(timeoutHandler);

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

        resolve(choice);
        reader.close();
      });
    } catch (e) {
      resolve(defaultChoice);
      reader.close();
    }
  });
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
If a file called 'beyo.json' exists in the current directory, load it and
return it's content

@return Object
*/
function getInstanceOptions() {
  var exists = fs.existsSync(BEYO_CONFIG);

  if (exists) {
    return JSON.parse(fs.readFileSync(BEYO_CONFIG));
  } else {
    return {};
  }
}