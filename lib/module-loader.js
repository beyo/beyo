
var glob = require('co-glob');
var views = require('koa-views');
var configLoader = require('./lib/config-loader');

/**
Load the given module and return the module info object upon success,
or false upon failure

@param {Beyo}    the beyo module object
@param {string}  the module path

@return {Object} the module info object, or false
*/
module.exports = function * moduleLoader(beyo, modulePath) {
  var moduleData = {
    config: yield configLoader(modulePath + 'conf');
  };

  var app = yield loadModuleApp(beyo, modulePath, moduleData);
  var controllerCount = yield loadControllers(beyo, app, modulePath, moduleData);

  return (moduleData.loader || controllerCount) && moduleData || false;
};


/**
Load the module and return the application to use when loading controllers, etc.

@param {Beyo}   the beyo module object
@param {string} the module path
@param {Object} the module info object

@return {Koa}   the application to use for this module
*/
function * loadModuleApp(beyo, modulePath, moduleData) {
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

@param {Beyo}    the beyo module object
@param {Koa}     the module's application
@param {string}  the module path
@param {Object}  the module info object

@return {int}    how many controllers wwere found
*/
function * loadControllers(beyo, app, modulePath, moduleData) {
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
