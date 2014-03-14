
const MIDDLEWARE_PATH = '/middlewares';


module.exports = function * middlewaresLoader(beyo, middlewares) {
  var ctx = {};
  var middlewareBasePath = beyo.appRoot + MIDDLEWARE_PATH;
  var middlewareKeys;
  var middlewareKey;
  var middlewarePath;
  var middleware;

  if (middlewares) {
    if (!(middlewares instanceof Object)) {
      throw new Error('Bad configuration : middlewares must be an object');
    }

    middlewareKeys = Object.keys(plugins);

    for (var i = 0, len = middlewareKeys.length; i < len; i++) {
      middlewareKey = middlewareKeys[i];

      if (ctx[middlewareKey]) {
        throw new Error('Conflict in context while loading middlewares : ' + middlewareKey);
      }

      middlewarePath = middlewareBasePath + '/' + middlewareKeys[i].replace('.', '/');
      middleware = require(middlewarePath);

      ctx[middlewareKey] = yield middleware(beyo, middlewares[pluginKey]);

      beyo.events.emit('middlewareLoaded', {
        path: middlewarePath,
        middleware: middleware,
        middlewareValue: ctx[middlewareKey]
      });
    }
  }

  return ctx;
};
