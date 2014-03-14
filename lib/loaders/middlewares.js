
const MIDDLEWARE_PATH = '/middlewares';


module.exports = function * middlewaresLoader(beyo, middlewares) {
  var ctx = {};
  var middlewareBasePath = beyo.appRoot + MIDDLEWARE_PATH;
  var middlewareKeys;
  var middlewareKey;
  var middlewareModule;
  var middleware;

  if (middlewares) {
    if (!(middlewares instanceof Object)) {
      throw new Error('Bad configuration : middlewares must be an object');
    }

    middlewareKeys = Object.keys(middlewares);

    for (var i = 0, len = middlewareKeys.length; i < len; i++) {
      middlewareKey = middlewareKeys[i];

      if (ctx[middlewareKey]) {
        throw new Error('Conflict in context while loading middlewares : ' + middlewareKey);
      }

      middlewareModule = middlewares[middlewareKey].module;
      middleware = beyo.appRequire(middlewareModule);

      ctx[middlewareKey] = yield middleware(beyo, middlewares[middlewareKey].options);

      beyo.events.emit('middlewareLoaded', {
        module: middlewareModule,
        middleware: middleware,
        middlewareValue: ctx[middlewareKey]
      });
    }
  }

  return ctx;
};
