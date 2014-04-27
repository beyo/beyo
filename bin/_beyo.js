#!/usr/bin/env node

/**
 * Module dependencies.
 */


var fs = require('fs');
var path = require('path');
var program = require('commander');
var commandPaths = [
  path.join(__dirname, 'commands'),
  path.join(process.cwd(), 'bin', 'commands')
];


// hack : override the program's name
process.argv[1] = process.argv[1].replace('_beyo.js', 'beyo.js');

// options

if (process.argv.length <= 2) {
  process.argv.push('-h');
}

//program
  //.option('-b, --backlog <size>', 'specify the backlog size [511]', '511')
  //.option('-r, --ratelimit <n>', 'ratelimit requests [2500]', '2500')
  //.option('-d, --ratelimit-duration <ms>', 'ratelimit duration [1h]', '1h')
//;

commandPaths.forEach(function (commandPath) {
  if (fs.existsSync(commandPath)) {
    fs.readdirSync(commandPath).sort(function (a, b) {
      return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    }).forEach(function (file) {
      if (/\.js$/.test(file)) {
        require(path.join(commandPath, file))(program.command(file.replace(/\.js$/, '')));
      }
    });
  }
});

program.parse(process.argv);
