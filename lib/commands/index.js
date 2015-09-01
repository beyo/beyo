
const BEYO_CONFIG = './beyo.json';


var path = require('path');
var readline = require('readline');
var fs = require('fs');
var chalk = require('chalk');
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

    bindOutputEvents(beyo, options);

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



/**
Listen to the various Beyo events and output feedback to stdout
*/
function bindOutputEvents(beyo, options) {

  // ####### config
  beyo.on('configLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Config]', 'Loading', evt.moduleName || chalk.bold('global'), path.relative(evt.basePath, evt.file));
    }
  });
  beyo.on('configLoadConflict', function (keyPath, src, dst, evt) {
    if (!options.quiet) {
      console.warn('[Config]', 'Conflict in config key', '"' + evt.keyPath + '"', 'in', evt.file, src, dst);
    }
  });
  beyo.on('configLoadError', function (evt) {
    var err = evt.error;
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Config]', evt.error.stack || evt.error);
      } else {
        console.error('[Config]', evt.error.message || evt.error);
      }
    }
  });
  //beyo.on('configLoadComplete', function (evt) { });


  // ####### Logger
  beyo.on('loggerLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Logger]', 'Loading logger');
    }
  });
  beyo.on('loggerLoaded', function (evt) {
    var logger = evt.logger;
    if (options.verbose && !options.quiet) {
      console.info('[Logger]', 'Loaded levels :', Object.keys(logger.levels).sort(function (a, b) {
          return logger.levels[a] - logger.levels[b];
        }).join(', '));

      Object.keys(logger.transports).forEach(function (transport) {
        var transportOptions = logger.transports[transport];
        console.info('[Logger]', 'Loaded transport :', transport, '@', transportOptions.level || 'info');
      });
    }
  });
  beyo.on('loggerLoadError', function (evt) {
    var err = evt.error;
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Logger]', evt.error.stack || evt.error);
      } else {
        console.error('[Logger]', evt.error.message || evt.error);
      }
    }
  });


  // ####### plugins
  beyo.on('pluginLoad', function (evt) {
    var pluginName;

    if (options.verbose && !options.quiet) {
      if (evt.pluginAlias) {
        pluginName = chalk.italic(evt.pluginAlias);
      } else {
        pluginName = evt.pluginName;
      }

      console.info('[Plugins]', 'Loading', pluginName, '(' + (evt.pluginModule || evt.file) + ')');
    }
  });
  beyo.on('pluginLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Plugins]', evt.error.stack || evt.error);
      } else {
        console.error('[Plugins]', evt.error.message || evt.error);
      }
    }
  });
  //beyo.on('pluginLoadComplete', function (evt) { });


  // ####### modules
  beyo.on('moduleLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Modules]', 'Loading', evt.module.name);
    }
  });
  beyo.on('moduleLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Modules]', evt.error.stack || evt.error);
      } else {
        console.error('[Modules]', evt.error.message || evt.error);
      }
    }
  });
  //beyo.on('moduleLoadComplete', function (evt) { });


  // ####### models
  beyo.on('modelLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Models]', 'Loading', evt.moduleName, evt.modelName);
    }
  });
  beyo.on('modelLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Models]', evt.error.stack || evt.error);
      } else {
        console.error('[Models]', evt.error.message || evt.error);
      }
    }
  });
  //beyo.on('modelLoadComplete', function (evt) { });


  // ####### services
  beyo.on('serviceLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Services]', 'Loading', evt.moduleName, evt.serviceName);
    }
  });
  beyo.on('serviceLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Services]', evt.error.stack || evt.error);
      } else {
        console.error('[Services]', evt.error.message || evt.error);
      }
    }
  });
  //beyo.on('serviceLoadComplete', function (evt) { });


  // ####### controllers
  beyo.on('controllerLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Controllers]', 'Loading', evt.moduleName, evt.controllerName);
    }
  });
  beyo.on('controllerLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Controllers]', evt.error.stack || evt.error);
      } else {
        console.error('[Controllers]', evt.error.message || evt.error);
      }
    }
  });
  //beyo.on('controllerLoadComplete', function (evt) { });


  // ####### HMVC
  //beyo.on('modulesLoadComplete', function (evt) { });

}