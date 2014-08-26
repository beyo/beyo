# DEV NOTES

These are development notes for new features and refactoring.

## Priority levels

1. **Critical** - should be done ASAP
2. **Severe** - should be done ASAP, current implementation is unstable
3. **Must** - should be done because it increase the framework coherence
4. **Nice to have** - features that should be implemented
5. **Idea** - an idea that needs to be researched and tested further


## Roadmap

### Plugins and Services def refactor (Severe)

The current definition for "plugins" are modules that can be loaded and be set both globally and unto modules data. This is not good as it creates duplicates.

A **plugin** is a global, or application-wide, available module, loaded by Beyo Core during initialization time. Plugins expose only one yieldable function that takes a single argument; `beyo`, the `Beyo` instance. This function should return another asynchronous function which, in return, take a single argument; `options`, the plugin options. Plugins may return anything.

```javascript
// ./plugins/foo.js
module.exports = function * fooPlugin(beyo) {
  var globalConfig = this.config;

  return function * (options) {
    /* return something */
  };
};
```

Plugins are made available through `beyo.plugins(name)` where `name` is the name of the plugin module (i.e. same as `reequire(name);`). The difference betwen using `require` and `beyo.plugins` is that, some plugins may be published inside the `appRoot/plugins` directory, or installed via npm. Beyo Core will sort it all out autommatically.

In the above example, retrieving the plugin would call `beyo.plugins('foo');`. The retrieved information is the inner generator function.

A **service** is a module-specific Node.js module. Unlike **plugins**, **services** declare only a single yieldable function that receives a single argument; the `beyo`, the `Beyo` instance. A service may return anything, but it is encouraged to return an object.

```javascript
// ./app/modules/my-module/services/foo.js
module.exports = function * fooService(beyo) {
  var moduleConfig = this.config;

  return {
    ...
  };
};
```

Services are made available through `beyo.services(name)` where `name` is the name of the service module (i.e. same as `require(moduleServicesPath + name);`), prefixed with the application module name.

In the above example, retrieving the service would call `beyo.services('my-module.foo')`. The retrieved information is the returned value.

#### Tests

Each plugin and services are isolated and can be instanciated very easily, thus testing is extremely easy to do.


### Module exposure (Severe)

Beyo Core should *not* expose `moduleData` through `beyo.modules`. Modules should be independant, and should only expose **services**; other modules should not access another module's config or data.


### Controllers (Must)

Controllers should be refactored to follow the **plugins** and **services** pattern.

```javascript
// .app/modules/my-module/controllers/foo.js
module.exports = function * fooController(beyo) {
  var moduleConfig = this.config;

  // beyo.app ...
};
```

**NOE**: what does a controller return????


### Models (Must)

Models should be refactored to follow the **plugins** and **services** pattern.

```javascript
// .app/modules/my-module/models/foo.js
module.exports = function * fooModel(beyo) {
  var moduleConfig = this.config;

  // model constructor
  return function FooModel(options) {
    // ...
  };
};
```

Models are made available through `beyo.models(name)` where `name` is the name of the model module (i.e. same as `require(moduleModelsPath + name);`), prefixed with the application module name.

In the above example, retrieving the model would call `beyo.models('my-module.foo')`. The retrieved information is the returned value (i.e. the model constructor function).


### Beyo Application Module unit testing (Must)

Each application module should be allowed to be tested very easily. Each application module's `test` direction should be automatically be loaded by the
testing framework. 

Also, replace `semicov` with `Istanbul` for both Beyo Core and the application coverage. Running tests should be done via the command `beyo test <module-name>` , where `module-name` is optional.