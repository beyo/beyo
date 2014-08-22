
var co = require('co');
var fs = require('co-fs');
var pathJoin = require('path').join;

module.exports = function init(command, actionWrapper) {
  command
    .description('Start the application')
    .action(actionWrapper(null, null, _startAction))
  ;
};

function * _startAction(beyo, args, options) {
  process.on('SIGTERM', terminate(beyo));
  process.on('SIGINT', terminate(beyo));

  yield beyo.init();

  beyo.once('serverStarted', function (port, host) {
    beyo.logger.log('info', 'Listening on %s:%s', host || 'localhost', port);
  });

  // listen
  beyo.start();

  return true;
}

function terminate(beyo) {
  return function _terminate(code, signal) {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');

    if (beyo.isListening) {
      beyo.stop();
    }

    process.exit(code || 0);
  };
}