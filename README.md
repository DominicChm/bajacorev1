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
- [ ] Implementing play controls for stored. (In progress)
- [ ] CSV exporting

## Less critical things
- [ ] File watching schemas
- [ ] Better schema editing (deleting modules, pretty much :/ )
## Ongoing things...

- [ ] Doc
- [ ] Tests
