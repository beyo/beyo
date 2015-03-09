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
var args = [ pathJoin(__dirname, '_beyo.js') ];
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
      process.chdir(relative(process.cwd(), p[1]));
      break;

    default:
      args.push(arg);
      break;
  }
});

if (mod_nodemon) {
  var nodemonConfig = pathJoin(process.cwd(), 'nodemon.json');

  if (fs.existsSync(nodemonConfig)) {
    nodemonConfig = require(nodemonConfig);
  } else {
    nodemonConfig = {};
  }

  nodemonConfig['script'] = args[0];
  nodemonConfig['args'] = args.slice(1);
  nodemonConfig['execMap'] =  {
    'js': process.argv[0]
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

  var proc = spawn(process.argv[0], args, { stdio: 'inherit' });
  proc.on('exit', function (code, signal) {
    console.log("Exit", code, signal);
    //process.on('exit', function () {
    //  console.log("Exit 2", code, signal);
    //  if (signal) {
    //    process.kill(process.pid, signal);
    //  } else {
    //    process.exit(code);
    //  }
    //});
  });

}
