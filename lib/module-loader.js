
var glob = require('co-glob');


/**
Load the given module and return the module info object upon success,
or false upon failure

@param {Beyo}    the beyo module object
@param {string}  the module path

@return {Object} the module info object, or false
*/
module.exports = function * moduleLoader(beyo, modulePath) {
  var moduleInfo = {};

  var app = yield loadModuleApp(beyo, modulePath, moduleInfo);
  var controllerCount = yield loadControllers(beyo, app, modulePath, moduleInfo);

  return (moduleInfo.loader || controllerCount) && moduleInfo || false;
};


/**
Load the module and return the application to use when loading controllers, etc.

@param {Beyo}   the beyo module object
@param {string} the module path
@param {Object} the module info object

@return {Koa}   the application to use for this module
*/
function * loadModuleApp(beyo, modulePath, moduleInfo) {
  var loader;

  try {
    loader = require(modulePath);

    moduleInfo.loader = modulePath;
  } catch (e) {
    loader = false;
  }

  return loader && (yield loader(beyo, moduleInfo)) || beyo.app;
}


/**
Load all controllers given a module path

@param {Beyo}    the beyo module object
@param {Koa}     the module's application
@param {string}  the module path
@param {Object}  the module info object

@return {int}    how many controllers wwere found
*/
function * loadControllers(beyo, app, modulePath, moduleInfo) {
  var files = yield glob('**/*.js', { cwd: modulePath + 'controllers' });
  var file;
  var controllers = moduleInfo.controllers = [];

  for (var i = 0, len = files.length; i < len; i++) {
    file = files[i].replace(/\.js(on)?$/, '');
    controllers.push(file);

    yield (require(modulePath + 'controllers/' + files[i])(beyo, app, moduleInfo));
  }

  return controllers.length;
}
