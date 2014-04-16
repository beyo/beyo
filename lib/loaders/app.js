
var path = require('path');
var serve = require('koa-static');

module.exports = appLoader;
module.exports.registerStaticPaths = registerStaticPaths;


function * appLoader(beyo) {

  registerStaticPaths(beyo, beyo.app, beyo.config.staticPaths);

}

function registerStaticPaths(beyo, app, paths) {

  if (paths) {
    if (!(paths instanceof Array)) {
      beyo.logger.log('debug', 'Binding static path :', path.relative(process.cwd(), paths));
      app.use(serve(paths));
    } else {
      paths.forEach(function (staticPath) {
        beyo.logger.log('debug', 'Binding static path :', path.relative(process.cwd(), staticPath));
        app.use(serve(staticPath));
      });
    }
  }

}
