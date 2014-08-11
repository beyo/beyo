# DEV NOTES

These are development notes for new features and refactoring.

## Priority levels

1. **Critical** - should be done ASAP
2. **Severe** - should be done ASAP, but current implement is stable enough
3. **Must** - should be done because it increase the framework coherence
4. **Nice to have** - features that should be implemented
5. **Idea** - an idea that needs to be researched and tested further


## Roadmap


### Refactor `lib/loaders/app.js` and remove `beyo.app.public` and `beyo.app.secured` dependencies (Must)

#### Rationale

Not all applications will require this setup and... it's ugly. Applications should be allowed to create
any sub applications as required, and binding static routes to them should be streamlined and generalized.
Also, adding sub-applications to `beyo.app` (i.e. `beyo.app.public`) is *not* a good idea and there should,
perhaps, have an application registry; calling `beyo.createSubApp()` should perhaps accept a "name" argument
to register the application for static routes. This will allow modules to register their own static content
unto their own declared app. Something like :

```javascript
var pub = beyo.createSubApp('public');

pub === beyo.getSubApp('public');  // -> true
```

Thus, static paths may use this to register middlewares to.

```json
{
  "staticPaths": {
    "public": "./pub"
  }
}
```

An application name should be arbitrary, however should follow the dot-nation, like for `error-factory`
exception names.

Using `beyo.app` to register static routes (or other config) could be done using a "default" key, such as :

```json
{
  "staticPaths": {
    "*": "./pub"
  }
}
```


#### Unit tests

This is quite easy to test, actually; create a sub-application and check that it was properly, and
immediately added to `beyo.app`.


### Start server only when everything has been initialized

#### Rationale

Some node modules, like `beyo-model-mapper` need to run some evolutions on the models. This can
be problematic as the evolutions would require to run async. There should be a way to queue task
during app initialization and wait until all tasks have completed. To avoid init freeze or other
weird stuff, a (configurable) timeout should also be implemented.