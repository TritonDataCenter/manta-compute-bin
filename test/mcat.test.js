/*
 * tst.mcat.js: mcat tests
 */

var mod_child_process = require('child_process');
var mod_fs = require('fs');
var mod_http = require('http');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var mcat = './bin/mcat';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'tst.mcat.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var after = helper.after;
var before = helper.before;
var test = helper.test;

function runTest(opts, callback)
{
	var spawn = mod_child_process.spawn(mcat, opts.opts);

	var stdout = '';
	spawn.stdout.on('data', function (data) {
		stdout += data;
	});

	var stderr = '';
	spawn.stderr.on('data', function (data) {
		stderr += data;
	});

	var error = null;
	spawn.on('error', function (err) {
		error = err;
	});

	spawn.stdin.on('error', function (err) {
		error = err;
	});

	spawn.on('close', function (code) {
		var result = {
			stdout: stdout,
			stderr: stderr,
			code: code,
			error: error
		};
		callback(result);
	});

	process.nextTick(function () {
		spawn.stdin.write(opts.stdin || '');
		spawn.stdin.end();
	});
}

var PORT = 9876;
var SERVER = null;

before(function (cb) {
	SERVER = mod_http.createServer(function (req, res) {
		SERVER.requests.push(req);
		res.writeHead(204);
		res.end();
	}).listen(PORT, function (err) {
		cb(err);
	});
	SERVER.requests = [];
});

after(function (cb) {
	SERVER.close(function (err) {
		SERVER = null;
		cb(err);
	});
});

test('testHelp', function (t)
{
	runTest({
		stdin: '',
		opts: ['-h']
	}, function (result) {
		t.equal(2, result.code);
		t.done();
	});
});

test('testBasic', function (t)
{
	var url = '/MANTA_USER/stor/obj.txt';
	runTest({
		stdin: '',
		opts: ['-p', PORT, url]
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'code': 0,
			'stdout': '',
			'stderr': '',
			'error': null
		}, result);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal('true', req.headers['x-manta-reference']);
		t.equal('stdout', req.headers['x-manta-stream']);
		t.equal(url, req.url);
		t.equal('PUT', req.method);
		t.done();
	});
});

test('testMultiple', function (t)
{
	var urls = [
		'/MANTA_USER/stor/obj.txt',
		'/MANTA_USER/stor/obj2.txt'
	];
	runTest({
		stdin: '',
		opts: ['-p', PORT].concat(urls)
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'code': 0,
			'stdout': '',
			'stderr': '',
			'error': null
		}, result);
		t.equal(2, SERVER.requests.length);
		var gotUrls = [];
		for (var i = 0; i < SERVER.requests.length; ++i) {
			var req = SERVER.requests[i];
			t.equal('true', req.headers['x-manta-reference']);
			t.equal('stdout', req.headers['x-manta-stream']);
			t.equal('PUT', req.method);
			gotUrls.push(req.url);
		}
		gotUrls.sort();
		t.deepEqual(urls, gotUrls);
		t.done();
	});
});

test('testReducerSelection', function (t)
{
	var url = '/MANTA_USER/stor/obj.txt';
	runTest({
		stdin: '',
		opts: ['-p', PORT, '-r', '1', url]
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'code': 0,
			'stdout': '',
			'stderr': '',
			'error': null
		}, result);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal('true', req.headers['x-manta-reference']);
		t.equal('stdout', req.headers['x-manta-stream']);
		t.equal('1', req.headers['x-manta-reducer']);
		t.equal(url, req.url);
		t.equal('PUT', req.method);
		t.done();
	});
});
