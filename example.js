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

var FileStore = require('./').FileStore;

var my_store = new FileStore({
  filename: 'example_data.json',
  default_object: {}, // default = empty object
  min_save_interval: 1000, // default = 1 second
  max_backups: 3, // default = 3 backups
});

// Get a value, providing a default
var number_of_runs = my_store.get('number_of_runs', 0);
++number_of_runs;
// Store a value (will be written to disk asynchronously)
my_store.set('number_of_runs', number_of_runs);
console.log('This example has run ' + number_of_runs + ' time(s)');

// Node exits when all async operations are finished
