
var path = require('path');
var serve = require('koa-static');
var errorFactory = require('error-factory');

var StaticPathException = errorFactory('beyo.StaticPathException');



module.exports = registerStaticPaths;

/**
Register the static paths provided to their respective app instances. If any app
instance does not exist, an error will be thrown. All paths relative to the
application root directory (i.e. beyo.rootPath).

Examples :

   registerStaticPaths(beyo, {
     '*': './pub',              // register to beyo.getApp('*') (i.e. beyo.app)
     'secured': './spub'        // register to beyo.getApp('secured')
   });

   registerStaticPaths(beyo, [ './pub' ]);  // register to beyo.app

@param {Beyo} beyo              the beyo instance to register to
@param {Array|Object} paths     the paths to register with a static middleware
*/
function registerStaticPaths(beyo, paths) {
  function serverPath(app, key, pathValue) {
    var logAppStr = '[Static ' + (appKey ? (appKey + ' ') : '') + 'path] Binding :';

    if (pathValue instanceof Array) {
      pathValue.forEach(function (path) {
        path = path.relative(beyo.rootPath, path);

        beyo.logger.log('debug', logAppStr, path);
        app.use(serve(path));
      });
    } else {
      pathValue = path.relative(beyo.rootPath, pathValue);

      beyo.logger.log('debug', logAppStr, pathValue);
      app.use(serve(pathValue));
    }
  }

  if (paths instanceof Array) {
    serverPath(beyo.app, null, paths);
  } else if ((paths !== null) && (paths instanceof Object)) {
    Object.keys(paths).forEach(function (key) {
      serverPath(beyo.getApp(key), key, paths[appKey]);
    });
  }
}
