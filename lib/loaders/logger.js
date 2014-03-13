
var winston = require('winston');

module.exports = function * loggerLoader(beyo) {
  var logger = new (winston.Logger)(_getLoggerConfig(beyo.config && beyo.config.logger || {}));

  beyo.events.emit('loggerLoaded', logger);

  return logger;
};


function _getLoggerConfig(config) {
  // format config into instances of winston's transports
  ['transports', 'exceptionHandlers'].forEach(function (transportKey) {
    if (config[transportKey]) {
      var transports = config[transportKey];
      config[transportKey] = [];

      Object.keys(transports).forEach(function(transport) {
        var transportClass = classify(transport);
        if (!winston.transports[transportClass]) {
          throw new Error('Logger has no transport class : ' + transportClass);
        }
        config[transportKey].push(new (winston.transports[transportClass])(transports[transport]));
      });
    }
  });

  if (config.levels && (typeof config.levels === 'string')) {
    config.levels = winston.config[config.levels].levels;
  }
  if (config.colors && (typeof config.colors === 'string')) {
    config.colors = winston.config[config.colors].colors;
  }

  return config;
};


function classify(s) {
  function upper(m, t) {
    return t.toLocaleUpperCase();
  }

  return s.replace(/^(.)/, upper).replace(/-(.)/, upper);
}
