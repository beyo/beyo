# DEV NOTES

These are development notes for new features and refactoring.

## Priority levels

1. **Critical** - should be done ASAP
2. **Severe** - should be done ASAP, current implementation is unstable
3. **Must** - should be done because it increase the framework coherence
4. **Nice to have** - features that should be implemented
5. **Idea** - an idea that needs to be researched and tested further


## Roadmap

### Default Init Logging (must)

Even though `beyo.logger` is used, the actual logger being used by default, until the global configurations are loaded, is  `console.log`. This is problematic as it is not coherent with the step when the logger has been properly configured.

To resolve this, Beyo core should not use the configured logger, but strictly use `stdout` and `stderr`. These outputs can be redirected anyhow by the invoking program, so there is really no issue here. Optionally, the `start` command could provide some verbosity options to specify the level of information displayed when initializing.

The actual logger is intended to be used by the application and plugins surrounding Beyo core.

#### Proposed command options

* **-v, --verbose** will display everything to `stdout`. Otherwise, just display basic information.
* **-s, --show-stack-trace** will display stack trace to errors during the initialization process (i.e. loaders). Otherwise, just display error messages.
* **-q, --quiet** do not display *anything*. This option overrides **-v** and **-s**.