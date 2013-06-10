/*
 * lib/string-write-buffer.js: Write in larger chunks.
 */

var mod_assert = require('assert-plus');
var mod_stream = require('stream');
var mod_util = require('util');

/*
 * This wraps a writable stream, but only implements the methods that msplit
 * currently needs.  It *does not* implement all of the Writable Stream
 * interface.
 */
function StringWriteBuffer(opts) {
	mod_assert.object(opts.stream, 'opts.stream');
	mod_assert.optionalNumber(opts.bufferSize, 'opts.bufferSize');

	var self = this;
	self.stream = opts.stream;
	self.bufferSize = opts.bufferSize || 1024 * 128; // 128 k
	self.writable = self.stream.writable;

	//These will be reset.
	self.buffer = '';
	self.offset = 0;

	['open', 'drain', 'error', 'close'].forEach(function (ev) {
		opts.stream.on(ev, self.emit.bind(self, ev));
	});
}

mod_util.inherits(StringWriteBuffer, mod_stream);
exports.StringWriteBuffer = StringWriteBuffer;

StringWriteBuffer.prototype.write = function write(string) {
	var self = this;

	// Should this emit an error?
	if (!self.writable) {
		return (true);
	}

	self.buffer += string;
	self.offset += Buffer.byteLength(string, 'utf8');

	if (self.offset >= self.bufferSize) {
		var flushed = self.stream.write(self.buffer, 'utf8');
		self.buffer = '';
		self.offset = 0;
		return (flushed);
	} else {
		return (true);
	}
};

StringWriteBuffer.prototype.end = function close() {
	var self = this;
	self.stream.write(self.buffer, 'utf8');
	self.offset = 0;
	self.writable = false;
	return (self.stream.end());
};
