/*global describe:true,it:true,afterEach:true,beforeEach:true*/

var expect = require('chai').expect;
var FileStore = require('../index.js').FileStore;
var fs = require('fs');

describe('#fs-store', function () {
  var default_options = {
    filename: 'test_data.json',
    min_save_interval: 25,
  };

  beforeEach(function () {
    [
      'test_data.json',
      'test_data.json.0.bak',
      'test_data.json.1.bak',
      'test_data.json.2.bak',
      'test_data.json.3.bak',
      'test_data.json.tmp'
    ].forEach(function (filename) {
      try {
        fs.unlinkSync(filename);
      } catch (ignore) {
      }
    });
  });
  afterEach(function (done) {
    setTimeout(function () {
      // Wait for any previous flushes to finish, in case the crash
      done();
    }, default_options.min_save_interval * 2);
  });

  it('should work simply', function (done) {
    var my_store = new FileStore(default_options);
    var foo = my_store.get('foo', 1);
    expect(foo).to.equal(1);
    my_store.set('foo', foo + 1);
    expect(my_store.get('foo')).to.equal(2);
    my_store.onFlush(done);
  });
  it('should get saved values on next run', function (done) {
    var my_store = new FileStore(default_options);
    var foo = my_store.get('foo', 0);
    expect(foo).to.equal(0);
    my_store.set('foo', 1);
    my_store.onFlush(function () {
      my_store = new FileStore(default_options);
      expect(my_store.get('foo')).to.equal(1);
      my_store.onFlush(done);
    });
  });
  it('should save after a no-op change', function (done) {
    var my_store = new FileStore(default_options);
    my_store.set('foo', 1);
    setImmediate(function () {
      my_store.set('foo', 1); // sets needs_write, but no write will happen
      my_store.onFlush(function () {
        my_store.set('foo', 2);
        my_store.onFlush(function () {
          my_store = new FileStore(default_options);
          expect(my_store.get('foo')).to.equal(2);
          my_store.onFlush(done);
        });
      });
    });
  });
  it('should not get stuck on no-op change', function (done) {
    var my_store = new FileStore(default_options);
    my_store.set('foo', 1);
    my_store.onFlush(function () {
      my_store.set('foo', 1);
      my_store.onFlush(done);
    });
  });
  it('should not get stuck on no-op change outside save interval', function (done) {
    var my_store = new FileStore(default_options);
    my_store.set('foo', 1);
    my_store.onFlush(function () {
      setTimeout(function () {
        my_store.set('foo', 1);
        my_store.onFlush(done);
      }, default_options.min_save_interval * 2);
    });
  });
  // it('should gracefully deal with multiple stores modifying the same file', function (done) {
  //   // Note: the output is not deterministic, it will be one of the 4 saves,
  //   // which is okay, we just don't want a crash in this case?  Perhaps we would
  //   // rather have a crash, as the application developer appears to be doing
  //   // something wrong.
  //   function incStore(next) {
  //     var my_store = new FileStore(default_options);
  //     my_store.set('foo', my_store.get('foo', 0) + 1);
  //     my_store.onFlush(next);
  //   }
  //   function makeStoreAndBackups(next) {
  //     incStore(function () {
  //       incStore(function () {
  //         incStore(next);
  //       });
  //     });
  //   }
  //   makeStoreAndBackups(function () {
  //     var left = 4;
  //     function stepDone() {
  //       if (--left === 0) {
  //         done();
  //       }
  //     }
  //     for (var ii = 0; ii < 4; ++ii) {
  //       incStore(stepDone);
  //     }
  //   });
  // });
});
