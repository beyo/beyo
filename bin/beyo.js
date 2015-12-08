#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var fs = require('fs');
var pathJoin = require('path').join;
var relative = require('path').relative;
var spawn = require('child_process').spawn;
var debug = require('debug')('beyo');
var args = [ '--harmony', pathJoin(__dirname, '_beyo.js') ];
var mod_nodemon = false;


process.argv.slice(2).forEach(function (arg){
  var p = arg.split('=');

  switch (p[0]) {
    case '--nodemon':
      mod_nodemon = true;
      break;

    case '--appPath':
      if (!p[1]) {
        throw new Error("Missing path");
      }
      console.log(p[1], typeof p[1]);
      process.chdir(relative(process.cwd(), p[1]));
      break;

    default:
      args.push(arg);
      break;
  }
});

if (mod_nodemon) {
  var nodemonConfig = pathJoin(process.cwd(), 'nodemon.json');

  // FIXME : manually restarting the application throws an exception
  //         see: https://github.com/remy/nodemon/issues/289
  if (fs.existsSync(nodemonConfig)) {
    nodemonConfig = require(nodemonConfig);
  } else {
    nodemonConfig = {};
  }

  nodemonConfig['script'] = args[1];
  nodemonConfig['args'] = args.slice(2);
  nodemonConfig['execMap'] =  {
    'js': [process.argv[0], args[0]].join(' ')
  };

  var app = require('nodemon')(nodemonConfig);

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

  var proc = spawn(process.argv[0], args, { stdio: 'inherit', customFds: [0, 1, 2] });
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
