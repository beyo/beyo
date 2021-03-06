
var winston = require('winston');
var errorFactory = require('error-factory');

var LoggerLoaderException = errorFactory('beyo.LoggerLoaderException', [ 'message', 'messageData' ]);


module.exports = function * loggerLoader(beyo, options) {
  var logger;
  var eventData;

  if (options === undefined) {
    throw LoggerLoaderException('No options specified');
  } else if (options === null || options.__proto__.constructor !== Object) {
    throw LoggerLoaderException('Invalid options value: {{options}}', { options: String(options) });
  }

  eventData = {
    options: options
  };

  beyo.emit('loggerLoad', eventData);

  try {
    logger = new winston.Logger(_getLoggerConfig(options));

    eventData.logger = logger;

    beyo.emit('loggerLoadComplete', eventData);
  } catch (e) {
    beyo.emit('loggerLoadError', e, eventData);
    throw e;  // resend error
  }

  return logger;
};


function _getLoggerConfig(config) {
  // format config into instances of winston's transports
  ['transports', 'exceptionHandlers'].forEach(function (transportKey) {
    if (transportKey in config) {
      var transports = config[transportKey];

      config[transportKey] = [];

      if (transports !== null && transports.__proto__.constructor === Object) {
        Object.keys(transports).forEach(function(transport) {
          var transportClass = classify(transport);
          if (!winston.transports[transportClass]) {
            throw LoggerLoaderException('Logger has no transport class: {{transport}}', { transport: transportClass });
          }
          config[transportKey].push(new (winston.transports[transportClass])(transports[transport]));
        });
      } else {
        throw LoggerLoaderException('Invalid transports: {{transports}}', { transports: transports });
      }
    }
  });

  ['levels', 'colors'].forEach(function (cfgKey) {
    if (cfgKey in config) {
      if (typeof config[cfgKey] === 'string') {
        config[cfgKey] = getFromWinstonConfig(config[cfgKey], cfgKey);
      } else if (config[cfgKey] === null || config[cfgKey].__proto__.constructor !== Object) {
        throw LoggerLoaderException('Invalid {{property}} config string: {{key}}', { property: cfgKey, key: config[cfgKey] });
      }
    }
  });

  return config;
};


function getFromWinstonConfig(key, requiredProperty) {
  var config = winston.config[key];

  if (config && config.__proto__.constructor === Object && requiredProperty in config) {
    return config[requiredProperty];
  } else {
    throw LoggerLoaderException('Invalid {{property}} config string: {{key}}', { property: requiredProperty, key: key });
  }
}


function classify(s) {
  function upper(m, t) {
    return t.toLocaleUpperCase();
  }

  return s.replace(/^(.)/, upper).replace(/-(.)/, upper);
}
