# DEV NOTES

These are development notes for new features and refactoring.

## Priority levels

1. **Critical** - should be done ASAP
2. **Severe** - should be done ASAP, but current implement is stable enough
3. **Must** - should be done because it increase the framework coherence
4. **Nice to have** - features that should be implemented
5. **Idea** - an idea that needs to be researched and tested further


## Roadmap


### Remove `beyo.init` (Must)

#### Rationale

The rationale to this is that the `beyo` object should not expose one-time functions. This
function should be available only from the application's `/index.js` file's context, as
`this.init(require);`. Since there is no need to initialize an application any other way,
calling this function any other way is pointless.

#### Unit tests

To test this feature, there can be a `/index.js` fixture file loaded by the framework.


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

#### Unit tests

This is quite easy to test, actually; create a sub-application and check that it was properly, and
immediately added to `beyo.app`.