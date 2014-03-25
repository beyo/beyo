
var glob = require('co-glob');

/**
Load configurations from the given path and return the merged object

@param {string} configPath   the configuration path to load from (basedir)
@param {Beyo} beyo           the beyo module object

@return {Object}             the (merged) configuration object
*/
module.exports = function * configLoader(configPath, beyo) {
  var config = {};
  var files = yield glob('**/*.{js,json}', { cwd: configPath });

  files.reverse().forEach(function (file) {
    var keyPath = file.split('/');
    var confCtx = config;
    var conf = beyo.appRequire(configPath + '/' + file.replace(/\.js(on)?$/, ''));

    for (var i = 0, len = keyPath.length - 1; i < len; i++) {
      confCtx = confCtx[keyPath[i]] || (confCtx[keyPath[i]] = {});
    }

    Object.keys(conf).forEach(function (key) { confCtx[key] = conf[key]; });
  });

  beyo.events.emit('configLoaded', {
    path: configPath,
    files: files,
    config: config
  });

  return config;
};
