#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var spawn = require('child_process').spawn
  , args = [ '--harmony', __dirname + '/_beyo.js' ];

process.argv.slice(2).forEach(function (arg){
  var flag = arg.split('=')[0];

  switch (flag) {
    // case add custom args here...
    //   break;

    default:
      args.push(arg);
      break;
  }
});

var proc = spawn(process.argv[0], args, { customFds: [0,1,2] });
proc.on('exit', function (code, signal) {
  process.on('exit', function () {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code);
    }
  });
});
