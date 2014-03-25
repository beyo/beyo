
var co = require('co');
var beyo = require('../..');

module.exports = function init(command) {
  command
    .description('Start the application')
    .option('-i, --interface <address>', 'specify the network interface to use [0.0.0.0]', '0.0.0.0')
    .option('-p, --port <port>', 'specify the port [4044]', '4044')
    .action(_initAction)
  ;
};

function _initAction(args) {
  process.on('SIGINT', function() {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');
    process.exit(0);
  });

  // init app
  co(function * () {
    yield require(beyo.appRoot)(beyo);
  })(function (err) {
    if (err) {
      beyo.logger.log('error', err.stack || err);
      process.exit(-1);
    } else {
      // listen
      beyo.app.listen(args['port'], args['host']);
      beyo.logger.log('info', 'Listening on %s:%s', args['interface'], args['port']);
    }
  });
}
