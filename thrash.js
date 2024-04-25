var FileStore = require('./').FileStore;

var my_store = new FileStore({
  filename: 'thrash.json',
  default_object: {}, // default = empty object
  min_save_interval: 1000, // default = 1 second
  max_backups: 1, // default = 3 backups
});

var mods = 0;
function domod() {
  my_store.set(String(Math.random()), Math.random());
  ++mods;
  if (mods % 100000 === 0) {
    console.log(mods);
  }
  setImmediate(domod);
}
domod();
