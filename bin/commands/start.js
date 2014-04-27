
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
  var beyo = require('../..');

  process.on('SIGINT', function() {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');
    process.exit(0);
  });

  // init app
  co(function * () {
    if (yield fs.exists(pathJoin(beyo.appRoot, 'index.js'))) {
      yield require(beyo.appRoot)(beyo);
    } else {
      throw "Application not found! Did you forget to initialize it?\n" +
            "Type `beyo init` to create a new application.\n";
    }

    return beyo;
  })(function (err, beyo) {
    if (err) {
      beyo.logger.log('error', err.stack || err);
      process.exit(-1);
    } else {
      if (!beyo.config || !beyo.config.server || !beyo.config.server.port || !beyo.config.server.host) {
        beyo.logger.log('error', 'Missing server configuration', beyo.config.server);
        process.exit(-2);
      }

      // listen
      beyo.app.listen(beyo.config.server.port, beyo.config.server.host);
      beyo.logger.log('info', 'Listening on %s:%s', beyo.config.server.host, beyo.config.server.port);
    }
  });
}
