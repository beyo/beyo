
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
}

function terminate(beyo) {
  return function _terminate(code, signal) {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');

    process.exit(code || 0);
  };
}