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