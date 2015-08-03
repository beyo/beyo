#!/usr/bin/env node

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var program = require('commander');
var actioNWrapper = require('../lib/commands');
var commandPaths = [ path.join(__dirname, 'commands') ];

require('../lib/io/console').initialize();


if (path.join(process.cwd(), 'bin') !== __dirname) {
  commandPaths.push(path.join(process.cwd(), 'bin', 'commands'));
}

// options
program
  .version((function () {
    var pkg = require(path.join(__dirname, '..', 'package'));

    return pkg.name + '@' + pkg.version;
  })())
  .option('-v, --verbose', 'display a lot of initialization information', false)
  .option('-s, --show-stack-trace', 'on error, show stack trace with message', false)
  .option('-q, --quiet', 'do not display anything (ignores verbose)', false)
  .option('-C, --no-color', 'disable color support', false)
;

// if no command given, push '-h' to get some help!
if (!process.argv.slice(2).some(function (arg) {
  return arg.charAt(0) !== '-';
})) {
  process.argv.push('-h');
}

program.on('*', function (args) {
  console.error('Unknown command :', args[0]);
  console.error();
  process.exit(2);
});

commandPaths.forEach(function (commandPath) {
  if (fs.existsSync(commandPath)) {
    fs.readdirSync(commandPath).sort(function (a, b) {
      return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    }).forEach(function (file) {
      if (/\.js$/.test(file)) {
        require(path.join(commandPath, file))(program.command(file.replace(/\.js$/, '')), actioNWrapper);
      }
    });
  }
});

program.parse(process.argv);
