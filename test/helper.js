// Copyright 2012 Joyent.  All rights reserved.

var bunyan = require('bunyan');

///--- Exports

module.exports = {

	after: function after(teardown) {
		module.parent.exports.tearDown = function _teardown(callback) {
			try {
				teardown.call(this, callback);
			} catch (e) {
				console.error('after:\n' + e.stack);
				process.exit(1);
			}
		};
	},

	before: function before(setup) {
		module.parent.exports.setUp = function _setup(callback) {
			try {
				setup.call(this, callback);
			} catch (e) {
				console.error('before:\n' + e.stack);
				process.exit(1);
			}
		};
	},

	test: function test(name, tester) {
		module.parent.exports[name] = function _(t) {
			var _done = false;
			t.end = function end() {
				if (!_done) {
					_done = true;
					t.done();
				}
			};
			t.notOk = function notOk(ok, message) {
				return (t.ok(!ok, message));
			};

			tester.call(this, t);
		};
	}
};
