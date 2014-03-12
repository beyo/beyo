#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var co = require('co');
var beyo = require('..');

// options

program
  .option('-H, --host <host>', 'specify the host [localhost]', 'localhost')
  .option('-p, --port <port>', 'specify the port [4044]', '4044')
  //.option('-b, --backlog <size>', 'specify the backlog size [511]', '511')
  //.option('-r, --ratelimit <n>', 'ratelimit requests [2500]', '2500')
  //.option('-d, --ratelimit-duration <ms>', 'ratelimit duration [1h]', '1h')
  .parse(process.argv);


process.on('SIGINT', function() {
  console.log("... Shutting down");
  process.exit(0);
});

// init app
co(function * () {
  yield (require(beyo.appRoot + '/app'))(beyo);
})(function (err) {
  if (err) {
    // TODO : LOGGING
    console.log('Ooops!', err.stack || err);
    process.exit(-1);
  } else {
    // listen
   // beyo.app.listen(program.port, program.host);
    console.log('Listening on %s:%s', program.host, program.port);
  }
});
