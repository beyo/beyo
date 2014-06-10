# Module Config

Each module may define their own personal configuration, which will be aavilable through
the controller's `moduleData`, or `beyo.modules.<module>.config` variable.


## `dependencies` *{Array}*

Specify the module dependencies. If the specified are present, they will be loaded first.
The values are the actual module names, as named by their respective folders. The dependant
modules will be loaded in their declared order. If a dependant module was already loaded,
the next one will be loaded.

### Example: dependencies for module "inventory"

```json
{
  "dependencies": [
    "archives"
    "users"
  ]
}
```

**NOTE**: cyclical dependencies are not allowed and will generate an error.


## modelDependencies *{Object}*

Specify the model dependencies. Since dependencies are optional, the order in which models
are loaded is determine by the names; that is, alphabetically. Once a model is loaded,
*then* it's dependencies are evaluated, and loaded if any.

### Example: model dependencies for "users"

```json
{
  "modelDependencies": {
    "user-profile": [
      "user"
    ],
    "user-role": [
      "user",
      "role"
    ],
    "role-permissions": [
      "role"
    ]
  }
}
```

**NOTE** : This configuration option is not intended to load models from other modules.
Use the `dependencies` option instead.

**NOTE**: cyclical dependencies are not allowed and will generate an error.


## plugins *{Object}*

Specify which plugins will be loaded and available from the module. Be aware that plugins
will not know if they are being loaded globally or from a module's configuration. Please
refer to the [Plugins](#Plugins) section for more information.


## staticPaths *{Array}*

Specify an array of paths that will be served as static content from the module's application
(or root application if the module does not create a sub-application). Each path will be added
as static middleware and served as is, mounted directly at the root of the application router.

The `staticPaths` config value may be an `array` or an `object`.

* If it is an `array`, each value should be a valid path (`string`) that will be added to the
  global application instance (`beyo.app`).
* If it is an `object`, there can be two (2) keys, whose values are `arrays`. These keys can be
  either `public` or `secured`. Specifying an `object` to the static paths config requires the
  application to declare `beyo.app.public` and `beyo.app.secured` accordingly, each a `koa`
  instance.

### Example: add static contents to `beyo.app`

```json
{
  "staticPaths": [
    "./jsCache",
    "./pub"
  ]
}
```

### Example: add static contents to `beyo.app.public` (properly created)

```json
{
  "staticPaths": {
    "public": [
      "./pub"
    ],
    "secured": [
      "./pubs"
    ]
  }
}
```