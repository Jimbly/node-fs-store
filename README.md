node-fs-store
=============

Trivially simple interface for a robust file-system backed store for node.  The
goal of this module is to provide a simple to use module that will persist data
locally in a robust manner (recovers if your process exits while writing, etc),
for simple applications that do not wish to spend the time to set up a
full-fledged database or something similar.

Features:
* multiple backups
* robust failure recovery
* single async load
* in-memory cache (effectively synchronous API)
* rate-limited background flushing

## Getting Started
(Once live on NPM): Install the module with: `npm install fs-store`

Non-NPM install: Save index.js as fs-store.js and instead use `require('./fs-store.js')`

```javascript
var FileStore = require('fs-store').FileStore;

// Create a store
var my_store = new FileStore('example_data.json');

// Get a value, providing a default
var number_of_runs = my_store.get('number_of_runs', 0);

// Store a value (will be written to disk asynchronously)
my_store.set('number_of_runs', number_of_runs + 1);

// Get the value back (immediately reflected in the store,
// even if it is not yet on disk)
console.log('This example has run ' + my_store.get('number_of_runs') + ' time(s)');
```

## Advanced Configuration
```javascript
var FileStore = require('fs-store').FileStore;

var my_store = new FileStore({
  // File name to use to back the store, required parameter
  filename: 'example_data.json',

  // Providing a default object to be used if the file does
  // not exist (or all backups are unrecoverable)
  // Default value = {}
  default_object: { foo: 'bar' },

  // Minimum milliseconds between two consecutive saves
  // Default value = 1000 (1 second)
  min_save_interval: 2500,

  // Maximum number of additional backups to keep.  Must be >= 1
  // Default value = 3
  max_backups: 3,
});
```

## Notes
All saves happen asynchronously, so if your program is entirely synchronous, no
data will be saved until the main part of the program exits (at which point it
will execute a single write).

The asynchronous saves, by default, happen at most once per second, and batch
all modifications smartly so if you make three .set() calls in a block of
code, all of the modifications will be saved at once (e.g. it does not start
saving after the first set() call, waiting before saving the second and third,
but instead starts saving once your code execution has yielded and saves all
three values).

