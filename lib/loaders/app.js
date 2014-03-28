
var serve = require('koa-static');

module.exports = appLoader;
module.exports.registerStaticPaths = registerStaticPaths;


function * appLoader(beyo) {

  registerStaticPaths(beyo.app, beyo.config.staticPaths);

}

function registerStaticPaths(app, paths) {

  if (paths) {
    if (!(paths instanceof Array)) {
      app.use(serve(paths));
    } else {
      paths.forEach(function (path) {
        app.use(serve(path));
      });
    }
  }

}
