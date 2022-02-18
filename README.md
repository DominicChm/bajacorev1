# BajaCore

Note I didn't include (substantial) stuff that was completed a long time ago.

- [x] DAQ schema management and persistence.
- [x] Module type definitions
- [x] Module instance definitions
- [x] Reloading on breaking change (In progress)
    - Need to standardize how to recognize a breaking schema change.
    - NEED TO PRESERVE NON-PERSISTANT CONFIG!!! Can't re-create instances :/
- [x] "Playing" of realtime data flow
    - IMPLEMENTED (BADLY!!!). Needs to be refactored to take into account module timestamps, which it doesn't atm.
      Current version is for internal testing more than anything else.
- [x] Writing realtime data flow to disk
- [x] Reading and parsing stored data from disk
- [x] Implementing play controls for stored.
- [ ] CSV exporting (In progress)
    - HTTP endpoint framework in place and working - just need to convert UUIDs to names before exporting.
- [ ] Data translation (Convert raw analog value into PSI, for example. Probably a playbackManager setting...)
- [ ] ___CORE IS WORKING :D___

### Other things that need implementing
- [ ] UI overhaul (Nathan?).
- [ ] Metadata file. (time created, length, etc...). Probably JSON. Part of storedRun? Or both?
- [ ] Consider how module-module comms should be handled. From within? IE brake pressure sends LED its value, or LED directly listens to brake pressure? __Or externally? IE a separate module creates the link between the two?__
- [ ] Module-Module references and behavior.
- [ ] Way to add custom module behavior... Handler class passed with config? Object with functions? Or not at all (external modules implement that)?
- [ ] Module state (connected, disconnected, flaky) and performance (packets received, avg. packets / sec, etc...)
  tracking for realtime runs. Possibly store as well in bin format.
- [ ] Refactor to allow config extension with common values, like frame interval.
  - Currently, there's no guarentee any given config will have a way to configure a value. Need to make it so that module-specific configs all extend a common, base, config.
- [ ] Data + Config struct generation (maybe even code snippets?) to assist coding module firmware. Make accessible through web.
- [ ] File watching schemas
- [ ] Better schema editing (deleting modules, pretty much :/ )

## Ongoing things...

- [ ] Doc
- [ ] Tests
