// Copyright (c) 2013, Joyent, Inc. All rights reserved.

var common = require('./common');
var stringWriteBuffer = require('./string-write-buffer');

function createStringWriteBuffer(opts) {
	return (new stringWriteBuffer.StringWriteBuffer(opts));
}

module.exports = {
	createStringWriteBuffer: createStringWriteBuffer,
	mantaFileSave: common.mantaFileSave,
	mantaSignNull: common.mantaSignNull,
	mantaObjectNameEncode: common.mantaObjectNameEncode
};
