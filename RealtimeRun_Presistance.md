# Realtime Run Persistence
The main problem with config/schema changes is for the potential for a change that needs side effects to occur.
For example, if a module needs to listen to the data from another, changing the ID of which module it listens to 
requires it to update internal links to the new ID. That's a process
