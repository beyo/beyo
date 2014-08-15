#!/usr/bin/env node

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var program = require('commander');
var actioNWrapper = require('../lib/commands');
var commandPaths = [
  path.join(__dirname, 'commands'),
  path.join(process.cwd(), 'bin', 'commands')
];


// hack : override the program's name
process.argv[1] = process.argv[1].replace('_beyo.js', 'beyo.js');

// options
program.version((function () {
  var pkg = require(path.join(__dirname, '..', 'package'));

  return pkg.name + '@' + pkg.version;
})());

// if no options given, assume "help" is implied
if (process.argv.length <= 2) {
  process.argv.push('-h');
}

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
