
var co = require('co');
var fs = require('co-fs');
var pathJoin = require('path').join;

module.exports = function init(command) {
  command
    .description('Start the application')
    .action(_initAction)
  ;
};

function _initAction(args) {
  var beyo;

  // init app
  co(function * () {
    var beyoConf;

    if (yield fs.exists(pathJoin(process.cwd(), 'beyo.json'))) {
      beyoConf = require(pathJoin(process.cwd(), 'beyo.json'));

      if (beyoConf['env']) {
        process.env.NODE_ENV = beyoConf['env'];
      }
    }

    beyo = require('../..');

    process.on('SIGTERM', terminate(beyo));
    process.on('SIGINT', terminate(beyo));

    if (yield fs.exists(pathJoin(beyo.appRoot, 'index.js'))) {
      yield require(beyo.appRoot)(beyo);
    } else {
      throw "Application not found! Did you forget to initialize it?\n" +
            "Type `beyo init` to create a new application.\n";
    }

  })(function (err) {
    if (err) {
      (beyo && beyo.logger || console).log('error', err.stack || err);
      process.exit(-1);
    } else {
      if (!beyo.config || !beyo.config.server || !beyo.config.server.port || !beyo.config.server.host) {
        beyo.logger.log('error', 'Missing server configuration');
        process.exit(-2);
      }

      // listen
      beyo.app.listen(beyo.config.server.port, beyo.config.server.host);
      beyo.logger.log('info', 'Listening on %s:%s', beyo.config.server.host, beyo.config.server.port);
    }
  });
}

function terminate(beyo) {
  return function _terminate(code, signal) {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');
    process.exit(code || 0);
  };
}