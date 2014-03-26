#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var commandPath = __dirname + '/commands/';

// options


if (process.argv.length <= 2) {
  process.argv.push('-h');
}

program
  //.option('-b, --backlog <size>', 'specify the backlog size [511]', '511')
  //.option('-r, --ratelimit <n>', 'ratelimit requests [2500]', '2500')
  //.option('-d, --ratelimit-duration <ms>', 'ratelimit duration [1h]', '1h')
;

require('fs').readdirSync(commandPath).sort(function (a, b) {
  return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
}).forEach(function (file) {
  if (/\.js$/.test(file)) {
    require(commandPath + file)(program.command(file.replace(/\.js$/, '')));
  }
});

program.parse(process.argv);
