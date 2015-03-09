/**
Wrap console methods with color support

Any call to console's `log`, `info`, `warn`, or `error` method with, as first
argument, a string enclosed in square braces will be formatted with colors.

*/

var chalk = require('chalk');

var originalMethods;


module.exports.restore = restoreConsole(global.console);
module.exports.initialize = initializeConsole(global.console);



function initializeConsole(console) {
  var methodsConfig = {
    'log': chalk.bold,
    'info': chalk.bold.blue,
    'warn': chalk.bold.yellow,
    'error': chalk.bold.red
  };

  return function initialize() {
    if (!originalMethods && chalk.supportsColor) {
      originalMethods = {};

      Object.keys(methodsConfig).forEach(function (method) {
        var _log = originalMethods[method] = console[method];

        console[method] = function () {
          if ((arguments.length > 1) && (arguments[0].toLowerCase() === method.toLowerCase()))  {
            arguments[0] = methodsConfig[method](String(arguments[0]));
          }

          _log.apply(console, arguments);
        };
      });
    }
  };
}


function restoreConsole(console) {
  return function restore() {
    if (originalMethods) {
      Object.keys(originalMethods).forEach(function (method) {
        console[method] = originalMethods[method];
      });

      originalMethods = undefined;
    }
  };
}