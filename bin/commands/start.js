
module.exports = function init(command, actionWrapper) {
  command
    .description('Start the application')
    .option('--dev', 'Force development mode', false)
    .action(actionWrapper(null, null, _startAction))
  ;
};

function _startAction(beyo, args, options) {
  return new Promise(function (resolve, reject) {
    process.on('SIGTERM', terminate(beyo, resolve));
    process.on('SIGINT', terminate(beyo, resolve));

    beyo.init();
  });
}

function terminate(beyo, resolve) {
  return function _terminate(code, signal) {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');

    resolve(code || 0);
  };
}