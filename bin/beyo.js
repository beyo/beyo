#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var spawn = require('child_process').spawn
  , args = [ '--harmony', __dirname + '/_beyo.js' ]
  , nodemon = false
;

process.argv.slice(2).forEach(function (arg){
  var flag = arg.split('=')[0];

  switch (flag) {
    case '-n':
    case '--nodemon':
      console.log("** DEV MODE");
      break;

    default:
      args.push(arg);
      break;
  }
});

if (nodemon) {

  // FIXME : http://remysharp.com/2014/01/20/nodemon-1-0/
  //         https://github.com/remy/nodemon/blob/master/doc/requireable.md

  var nodemon = require('nodemon');

  nodemon({
    script: 'app.js',
    ext: 'js json'
  });

  nodemon.on('start', function () {
    console.log('App has started');
  }).on('quit', function () {
    console.log('App has quit');
  }).on('restart', function (files) {
    console.log('App restarted due to: ', files);
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
