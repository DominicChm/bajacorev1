# BajaCore

Note I didn't include (substantial) stuff that was completed a long time ago.

- [x] DAQ schema management and persistence.
- [x] Module type definitions
- [x] Module instance definitions
- [ ] Reloading on breaking change (In progress)
    - Need to standardize how to recognize a breaking schema change.
    - NEED TO PRESERVE NON-PERSISTANT CONFIG!!! Can't re-create instances :/
- [ ] "Playing" of realtime data flow (In progress)
    - At time of writing, working on aggregating data packets that occur at the same time (but might be received at
      different ones).
- [ ] Writing realtime data flow to disk
- [ ] Reading and parsing stored data from disk
- [ ] Implementing play controls for stored.
    - Probably make all controls go through a PlayManager implementation...?

## Ongoing things...

- [ ] Doc
- [ ] Tests
