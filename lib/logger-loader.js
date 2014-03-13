
var winston = require('winston');

module.exports = function * loggerLoader(beyo) {
  var logger = new (winston.Logger)(_getLoggerConfig(beyo.config.logger || {}));

  return logger;
};


function _getLoggerConfig(config) {
  // format config into instances of winston's transports
  ['transports', 'exceptionHandlers'].forEach(function(transportKey) {
    if (config[transportKey]) {
      var transports = config[transportKey];
      config[transportKey] = [];

      Object.keys(transports).forEach(function(transport) {
        console.log("Transport found (need to classify)", transport);
        //config[transportKey].push(new (winston.transports[_s.classify(transport)])(transports[transport]));
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
