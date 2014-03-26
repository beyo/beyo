#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var pathJoin = require('path').join;
var relative = require('path').relative;
var spawn = require('child_process').spawn;
var debug = require('debug')('beyo');
var args = [ '--harmony', pathJoin(__dirname, '_beyo.js') ];
var mod_nodemon = false;


process.argv.slice(2).forEach(function (arg){
  var flag = arg.split('=')[0];

  switch (flag) {
    case '--nodemon':
      mod_nodemon = true;
      break;

    default:
      args.push(arg);
      break;
  }
});

if (mod_nodemon) {

  // FIXME : manually restarting the application throws an exception
  //         see: https://github.com/remy/nodemon/issues/289

  var app = require('nodemon')({
    script: args[1],
    //args: args.slice(2),
    execMap: {
      'js': [process.argv[0], args[0]].join(' ')
    }
  });

  debug('[nodemon] Starting application');

  app
  //.on('start', function () {
  //  console.log('App has started');
  //})
  //.on('quit', function () {
  //  console.log('App has quit');
  //})
  .on('restart', function (files) {
    if (files) {
      debug('[nodemon] %d file%s changed', files.length, files.length > 1 ? 's' : '');
      files.forEach(function (file) {
        debug('> %s', pathJoin('.', relative(process.cwd(), file)));
      });
    } else {
      debug('[nodemon] manual restart requested');
    }
  });

} else {

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

}
