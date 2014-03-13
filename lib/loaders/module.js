
var glob = require('co-glob');
var views = require('koa-views');
var configLoader = require('./config');
var pluginsLoader = require('./plugins');

/**
Load the given module and return the module info object upon success,
or false upon failure

@param {Beyo}    the beyo module object
@param {string}  the module path

@return {Object} the module info object, or false
*/
module.exports = function * moduleLoader(modulePath, beyo) {
  var moduleData = {};
  var app;
  var plugins;
  var controllerCount;

  beyo.events.emit('beforeModuleLoad', {
    path: modulePath,
    data: moduleData
  });

  moduleData.config = yield configLoader(modulePath + 'conf', beyo);
  moduleData.plugins = yield pluginsLoader(beyo, moduleData.config);
  app = yield loadModuleApp(modulePath, beyo, moduleData);
  controllerCount = yield loadControllers(modulePath, app, beyo, moduleData)

  beyo.events.emit('afterModuleLoad', {
    path: modulePath,
    app: app,
    data: moduleData
  });

  return (moduleData.loader || controllerCount) && moduleData || false;
};


/**
Load the module and return the application to use when loading controllers, etc.

@param {string} the module path
@param {Beyo}   the beyo module object
@param {Object} the module info object

@return {Koa}   the application to use for this module
*/
function * loadModuleApp(modulePath, beyo, moduleData) {
  var loader;
  var app;
  var defaultViewEngine;
  var viewsOptions;

  try {
    loader = require(modulePath);

    moduleData.loader = modulePath;
  } catch (e) {
    loader = false;
  }

  app = loader && (yield loader(beyo, moduleData)) || beyo.app;

  defaultViewEngine = (moduleData.config && moduleData.config.views && moduleData.config.views.defaultEngine)
                   || (beyo.config.views && beyo.config.views.defaultEngine)
                   || 'jade';
  viewsOptions = (moduleData.config && moduleData.config.views && moduleData.config.views.options)
              || (beyo.config.views && beyo.config.views.options)
              || {};

  app.use(views(modulePath + 'views', defaultViewEngine, viewsOptions));

  return app;
}

/**
Load all controllers given a module path

@param {string}  the module path
@param {Koa}     the module's application
@param {Beyo}    the beyo module object
@param {Object}  the module info object

@return {int}    how many controllers wwere found
*/
function * loadControllers(modulePath, app, beyo, moduleData) {
  var files = yield glob('**/*.js', { cwd: modulePath + 'controllers' });
  var file;
  var controllers = moduleData.controllers = [];

  for (var i = 0, len = files.length; i < len; i++) {
    file = files[i].replace(/\.js(on)?$/, '');
    controllers.push(file);

    yield (require(modulePath + 'controllers/' + files[i])(beyo, app, moduleData));
  }

  return controllers.length;
}