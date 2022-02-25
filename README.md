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
- [x] CSV exporting (In progress)
    - HTTP endpoint framework in place and working - A little out of order, but that's a FIXME...
- [x] Data translation (Convert raw analog value into PSI, for example. Probably a playbackManager setting...)
- [ ] Validation of entire schema. Currently, only modules are validated. (~1hr) (Part of v2 UI)
- [ ] Metadata file. (Name, desc, time created, length, etc...). Probably JSON. Part of storedRun? Or both? (~2hr) (Part of v2 UI)
- [ ] UI (User Interface) Version 2. (A lot of time...) (In progress)
- [ ] Test configuration emission. (IDK)
- [ ] Refactor to allow config extension with common values, like frame interval. (POSSIBLY MODIFY CTYPES FOR THIS FUNCTIONALITY??) (~3hr?)
  - Currently, there's no guarantee any given config will have a way to configure a value. Need to make it so that module-specific configs all extend a common, base, config.
  - Uses: Controlling global sample rate, batching size, etc.
- [ ] Better schema editing (deleting modules, pretty much :/ ) (~30min)
- [ ] Module framework (for ESPs)
- [ ] ___CORE IS WORKING :D___

### Other things that need implementing (Not critical for Data Acquisition)
- [ ] Test batching and (possibly) using UDP. (Bunch of time.)
  - If UDP can make network transfer more realtime, it might be worth the effort to switch to get rid of the aggregator.
  - The protocol can pretty easily be made transport-agnostic.
- [ ] Module state (connected, disconnected, flaky) and performance (packets received, avg. packets / sec, etc...)
  tracking for realtime runs. Possibly store as well in bin format.
- [ ] Module-Module references and behavior. 
  - Consider how module-module comms should be handled. From within? IE brake pressure sends LED its value, or LED directly listens to brake pressure? __Or externally? IE a separate module creates the link between the two?__
- [ ] Way to add custom module behavior... Handler class passed with config? Object with functions? Or not at all (external modules implement that)? (Hooks?)
- [ ] Data + Config struct generation (maybe even code snippets?) to assist coding module firmware. Make accessible through web.
- [ ] File watching schemas (meh)

## Ongoing things...

- [ ] Doc
- [ ] Tests
