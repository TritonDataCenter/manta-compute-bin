/*
 * tst.mtee.js: mtee tests
 */

var mod_fs = require('fs');
var mod_lib = require('../lib');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'write-buffer.test.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var after = helper.after;
var before = helper.before;
var test = helper.test;

before(function (cb) {
	cb();
});

after(function (cb) {
	cb();
});

test('testBasic', function (t)
{
	var data = 'hello';
	var file = tmpdir + '/write-buffer-test.txt';
	var wb = mod_lib.createStringWriteBuffer({
		stream: mod_fs.createWriteStream(file)
	});

	wb.on('open', function () {
		wb.write(data);
		wb.end();
	});

	wb.on('close', function () {
		var readData = mod_fs.readFileSync(file);
		t.equal(data, readData);
		mod_fs.unlinkSync(file);
		t.done();
	});
});

test('testWriteUpToBoundary', function (t)
{
	var file = tmpdir + '/write-buffer-test.txt';
	var wb = mod_lib.createStringWriteBuffer({
		stream: mod_fs.createWriteStream(file),
		bufferSize: 2
	});

	wb.on('open', function () {
		wb.write('he');
		wb.write('ll');
		wb.write('o');
		wb.end();
	});

	wb.on('close', function () {
		var readData = mod_fs.readFileSync(file);
		t.equal('hello', readData);
		mod_fs.unlinkSync(file);
		t.done();
	});
});

test('testOverflowOnce', function (t)
{
	var data = 'aaaa';
	var file = tmpdir + '/write-buffer-test.txt';
	var wb = mod_lib.createStringWriteBuffer({
		stream: mod_fs.createWriteStream(file),
		bufferSize: 2
	});

	wb.on('open', function () {
		wb.write(data);
		wb.end();
	});

	wb.on('close', function () {
		var readData = mod_fs.readFileSync(file);
		t.equal(data, readData);
		mod_fs.unlinkSync(file);
		t.done();
	});
});

test('testOverflowMultipleTimes', function (t)
{
	var data = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	var file = tmpdir + '/write-buffer-test.txt';
	var wb = mod_lib.createStringWriteBuffer({
		stream: mod_fs.createWriteStream(file),
		bufferSize: 2
	});

	wb.on('open', function () {
		wb.write('aaaaaaaaaaaaaaa');
		wb.write('aaaaaaaaaaaaaaa');
		wb.end();
	});

	wb.on('close', function () {
		var readData = mod_fs.readFileSync(file);
		t.equal(data, readData);
		mod_fs.unlinkSync(file);
		t.done();
	});
});
