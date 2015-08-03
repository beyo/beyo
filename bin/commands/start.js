
module.exports = function start(command, actionWrapper) {
  command
    .description('Start the application')
    .action(actionWrapper(null, null, _startAction))
  ;
};

function _startAction(beyo, args, options) {
  return new Promise(function (resolve, reject) {
    process.on('SIGTERM', terminate(beyo, resolve));
    process.on('SIGINT', terminate(beyo, resolve));

    beyo.init().catch(function (err) {
      reject('Could not initialize application, execution terminated : ' + err.message);
    });
  });
}

function terminate(beyo, resolve) {
  return function _terminate(code, signal) {
    beyo.logger.log('info', 'Interruption signal received, shutting down now');

    resolve(code || 0);
  };
}