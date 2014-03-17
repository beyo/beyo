#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var spawn = require('child_process').spawn
  , args = [ '--harmony', __dirname + '/_beyo.js' ]
  , mod_nodemon = false
;

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

  //console.log(args);

  // FIXME : http://remysharp.com/2014/01/20/nodemon-1-0/
  //         https://github.com/remy/nodemon/blob/master/doc/requireable.md

  var app = require('nodemon')({
    script: args[1],
    watch: ['app/', 'conf/', 'layouts/'],
    execMap: {
      'js': "node --harmony"
    }
  });

  console.log('* nodemon enabled');

  app
  //.on('start', function () {
  //  console.log('App has started');
  //})
  //.on('quit', function () {
  //  console.log('App has quit');
  //})
  .on('restart', function (files) {
    if (files) {
      console.log('* nodemon', files.length, 'file(s) changed');
      files.forEach(function (file) {
        console.log('  >', file);
      });
    } else {
      console.log('* nodemon manual restart');
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
