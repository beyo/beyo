/**
Wrap console methods with color support

Any call to console's `log`, `info`, `warn`, or `error` method with, as first
argument, a string enclosed in square braces will be formatted with colors.


*/

const LOG_CLASS_PATTERN = /^\[.+\]$/;

var chalk = require('chalk');

// only if terminal supports colors... otherwise no need to wrap!
if (chalk.supportsColor) {

  !function (console) {
    var methodsConfig = {
      'log': chalk.bold,
      'info': chalk.bold.blue,
      'warn': chalk.bold.yellow,
      'error': chalk.bold.red
    };

    Object.keys(methodsConfig).forEach(function (method) {
      var _log = console[method];

      console[method] = function () {
        if ((arguments.length > 1) && (typeof arguments[0] === 'string') && LOG_CLASS_PATTERN.test(arguments[0]))  {
          arguments[0] = methodsConfig[method](String(arguments[0]));
        }

        _log.apply(console, arguments);
      };
    });

  }(global.console);

}