
var path = require('path');
var chalk = require('chalk');


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

    bindOutputEvents(beyo, options);

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


/**
Listen to the various Beyo events and output feedback to stdout
*/
function bindOutputEvents(beyo, options) {
  var workerName = ''; // chalk.red('');

  // ####### config
  beyo.on('configLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Config%s] Loading %s %s'
        , workerName
        , evt.moduleName || chalk.bold('global')
        , path.relative(evt.basePath, evt.file)
      );
    }
  });
  beyo.on('configLoadConflict', function (keyPath, src, dst, evt) {
    if (!options.quiet) {
      console.warn('[Config%s] Conflict in config key "%s" in %s %s %s'
        , workerName
        , evt.keyPath
        , evt.file
        , src
        , dst
      );
    }
  });
  beyo.on('configLoadError', function (evt) {
    var err = evt.error;
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Config%s] %s'
          , workerName
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Config%s] %s'
          , evt.error.message || evt.error
        );
      }
    }
  });
  //beyo.on('configLoadComplete', function (evt) { });


  // ####### Logger
  beyo.on('loggerLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Logger%s] Loading logger'
        , workerName
      );
    }
  });
  beyo.on('loggerLoaded', function (evt) {
    var logger = evt.logger;
    if (options.verbose && !options.quiet) {
      console.info('[Logger%s] Loaded levels : %s'
        , workerName
        , Object.keys(logger.levels).sort(function (a, b) {
            return logger.levels[a] - logger.levels[b];
          }).join(', ')
      );

      Object.keys(logger.transports).forEach(function (transport) {
        var transportOptions = logger.transports[transport];
        console.info('[Logger%s] Loaded transport : %s@%s'
          , workerName
          , transport
          , transportOptions.level || 'info'
        );
      });
    }
  });
  beyo.on('loggerLoadError', function (evt) {
    var err = evt.error;
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Logger%s] %s'
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Logger%s] %s'
          , evt.error.message || evt.error
        );
      }
    }
  });


  // ####### plugins
  beyo.on('pluginLoad', function (evt) {
    var pluginName;

    if (options.verbose && !options.quiet) {
      if (evt.pluginAlias) {
        pluginName = chalk.italic(evt.pluginAlias);
      } else {
        pluginName = evt.pluginName;
      }

      console.info('[Plugins%s] Loading %s (%s)'
        , workerName
        , pluginName
        , evt.pluginModule || evt.file
      );
    }
  });
  beyo.on('pluginLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Plugins%s] %s'
          , workerName
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Plugins%s] %s'
          , workerName
          , evt.error.message || evt.error
        );
      }
    }
  });
  //beyo.on('pluginLoadComplete', function (evt) { });


  // ####### modules
  beyo.on('moduleLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Modules%s] Loading %s'
        , workerName
        , evt.module.name
      );
    }
  });
  beyo.on('moduleLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Modules%s] %s'
          , workerName
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Modules%s] %s'
          , workerName
          , evt.error.message || evt.error
        );
      }
    }
  });
  //beyo.on('moduleLoadComplete', function (evt) { });


  // ####### models
  beyo.on('modelLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Models%s] Loading %s/%s'
        , workerName
        , evt.moduleName
        , evt.modelName
      );
    }
  });
  beyo.on('modelLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Models%s] %s'
          , workerName
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Models%s] %s'
          , workerName
          , evt.error.message || evt.error
        );
      }
    }
  });
  //beyo.on('modelLoadComplete', function (evt) { });


  // ####### services
  beyo.on('serviceLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Services%s] Loading %s/%s'
        , workerName
        , evt.moduleName
        , evt.serviceName
      );
    }
  });
  beyo.on('serviceLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Services%s] %s'
          , workerName
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Services%s] %s'
          , workerName
          , evt.error.message || evt.error
        );
      }
    }
  });
  //beyo.on('serviceLoadComplete', function (evt) { });


  // ####### controllers
  beyo.on('controllerLoad', function (evt) {
    if (options.verbose && !options.quiet) {
      console.info('[Controllers%s] Loading %s/%s'
        , workerName
        , evt.moduleName
        , evt.controllerName
      );
    }
  });
  beyo.on('controllerLoadError', function (evt) {
    if (!options.quiet) {
      if (options.showStackTrace) {
        console.error('[Controllers%s] %s'
          , workerName
          , evt.error.stack || evt.error
        );
      } else {
        console.error('[Controllers%s] %s'
          , workerName
          , evt.error.message || evt.error
        );
      }
    }
  });
  //beyo.on('controllerLoadComplete', function (evt) { });


  // ####### HMVC
  //beyo.on('modulesLoadComplete', function (evt) { });

}