/**
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2012-2014 Jimb Esser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
**/

var assert = require('assert');
var fs = require('fs');

function FileStore(options) {
  var self = this;
  if (typeof options === 'string') {
    options = {
      filename: options
    };
  }
  // Parse and check options
  var default_object = options.default_object || {};
  this.base_path = options.filename;
  assert.ok(this.base_path);
  this.min_save_interval = options.min_save_interval || 1000; // Save at most once a second
  this.max_backups = options.max_backups || 3;
  this.read_only = options.read_only || false;

  this.writing = false;
  this.needs_write = false;
  this.last_saved_data_store = '';
  this.on_flush = [];
  function tryFile(retries) {
    var filename = self.filePath(retries);
    var data;
    var good = false;
    try {
      data = fs.readFileSync(filename, 'utf8');
      self.last_saved_data_store = data;
      data = JSON.parse(data);
      good = true;
    } catch (ignore) {
    }
    if (!data || !good) {
      if (retries >= self.max_backups) {
        return default_object;
      }
      return tryFile(retries + 1);
    }
    return data;
  }
  this.data_store = tryFile(0);
}

FileStore.prototype.onFlush = function (cb) {
  var self = this;
  if (!self.writing && !self.needs_write) {
    return setImmediate(cb);
  }
  self.on_flush.push(cb);
};

FileStore.prototype.filePath = function (retries) {
  if (!retries) {
    return this.base_path;
  } else {
    return this.base_path + '.' + (retries-1) + '.bak';
  }
};

function callOnFlushCbs(self) {
  if (!self.on_flush.length) {
    return;
  }
  var cbs = self.on_flush;
  self.on_flush = [];
  for (var ii = 0; ii < cbs.length; ++ii) {
    cbs[ii]();
  }
}

FileStore.prototype.save = function () {
  var self = this;
  if (self.writing) {
    self.needs_write = true;
    return;
  }
  var data = JSON.stringify(self.data_store, undefined, 2);
  if (data === self.last_saved_data_store || self.read_only) {
    self.needs_write = false;
    callOnFlushCbs(self);
    return;
  }
  self.last_saved_data_store = data;
  self.writing = true;
  self.needs_write = false;
  fs.writeFile(self.base_path + '.tmp', data, function(err) {
    if (err) {
      throw err;
    }
    function removeBackup(retries, next) {
      // TODO: Could add rules here so that we delete if the time delta between
      // the two files in question is less than retries^2 hours or something so
      var filename = self.filePath(retries);
      fs.exists(filename, function (exists) {
        if (!exists) {
          return next();
        }
        if (retries === self.max_backups) {
          // just remove
          fs.unlink(filename, next);
        } else {
          removeBackup(retries+1, function () {
            fs.rename(filename, self.filePath(retries + 1), next);
          });
        }
      });
    }
    removeBackup(0, function (err) {
      if (err) {
        console.log('Error removing backup:', err);
      }
      fs.rename(self.base_path + '.tmp', self.base_path, function(err) {
        if (err) {
          throw err;
        }
        setTimeout(function () {
          self.writing = false;
          if (self.needs_write) {
            self.save();
          }
        }, self.min_save_interval);
        // Calling on_flush callbacks immediately, not after min_save_interval,
        // unless there's more data queued up to be written.
        if (!self.needs_write) {
          callOnFlushCbs(self);
        }
      });
    });
  });
};

// call .save() manually after making modifications
FileStore.prototype.getStore = function () {
  return this.data_store;
};

FileStore.prototype.get = function (key, defvalue) {
  if (Object.prototype.hasOwnProperty.call(this.data_store, key)) {
    return this.data_store[key];
  } else {
    return defvalue;
  }
};

FileStore.prototype.set = function (key, value) {
  this.data_store[key] = value;
  if (this.needs_write) {
    // Already dealt with
  } else {
    this.needs_write = true;
    // Don't call .save until next tick, so a bunch of modifications can happen
    // before a single .save() call
    setImmediate(this.save.bind(this));
  }
};

exports.FileStore = FileStore;
