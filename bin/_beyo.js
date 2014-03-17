#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var commandPath = __dirname + '/commands/';
var co = require('co');
var beyo = require('..');

// options

program
  .option('-i, --interface <address>', 'specify the network interface to use [0.0.0.0]', '0.0.0.0')
  .option('-p, --port <port>', 'specify the port [4044]', '4044')
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


process.on('SIGINT', function() {
  beyo.logger.log('info', 'Interruption signal received, shutting down now');
  process.exit(0);
});

// init app
co(function * () {
  yield (require(beyo.appRoot + '/app'))(beyo);
})(function (err) {
  if (err) {
    beyo.logger.log('error', err.stack || err);
    process.exit(-1);
  } else {
    // listen
    beyo.app.listen(program.port, program.host);
    beyo.logger.log('info', 'Listening on %s:%s', program['interface'], program['port']);
  }
});
