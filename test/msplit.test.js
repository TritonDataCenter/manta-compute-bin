/*
 * tst.msplit.js: msplit tests
 */

var mod_child_process = require('child_process');
var mod_fs = require('fs');
var mod_http = require('http');

var mod_bunyan = require('bunyan');

var helper = require('./helper.js');

var msplit = msplit = './bin/msplit';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'msplit.test.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var after = helper.after;
var before = helper.before;
var test = helper.test;

var PORT = 9876;
var SERVER = null;
var MANTA_URL = 'http://localhost:' + PORT;
var MANTA_OUTPUT_BASE = '/MANTA_USER/jobs/jobid/stor/reduce.1.';

function runTest(opts, callback)
{
	var env = {
		env: {
			'MANTA_URL': MANTA_URL,
			'MANTA_NO_AUTH': 'true',
			'MANTA_OUTPUT_BASE': MANTA_OUTPUT_BASE
		}
	};

	var spawn = mod_child_process.spawn(msplit, opts.opts, env);

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
		if (opts.debug) {
			console.log(result);
		}
		callback(result);
	});

	process.nextTick(function () {
		spawn.stdin.write(opts.stdin || '');
		spawn.stdin.end();
	});
}

before(function (cb) {
	SERVER = mod_http.createServer(function (req, res) {
		var body = '';
		req.on('data', function (data) {
			body += data;
		});
		req.on('end', function () {
			req.body = body;
			SERVER.requests.push(req);
			res.writeHead(204);
			res.end();
		});
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

function transformRequests(t, requests) {
	var reqs = {};
	for (var i = 0; i < requests.length; ++i) {
		var req = requests[i];
		t.ok(req.url.indexOf(MANTA_OUTPUT_BASE) === 0);
		t.ok(req.body);
		t.ok(req.headers['x-manta-reducer']);
		t.equal('stdout', req.headers['x-manta-stream']);
		reqs[req.headers['x-manta-reducer']] = req.body;
	}
	return (reqs);
}

test('testNoOpts', function (t)
{
	runTest({
		stdin: '',
		opts: []
	}, function (result) {
		t.equal(2, result.code);
		t.done();
	});
});

test('testBasic', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-n', 2],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '1\n3\n',
			'1': '2\n4\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicAltField', function (t)
{
	var sin = ['1,2,3',
		    '1,2,2',
		    '1,1,1',
		    '1,3,4',
		    ''].join('\n');

	runTest({
		stdin: sin,
		opts: ['-n', 2, '-f', '3', '-d', ','],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '1,2,3\n1,1,1\n',
			'1': '1,2,2\n1,3,4\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicJson', function (t)
{
	var sin = '{"x":1}\n{"x":2}\n{"x":3}\n{"x":4}\n';
	runTest({
		stdin: sin,
		opts: ['-n', 2, '-j', '-f', 'x'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '{"x":1}\n{"x":3}\n',
			'1': '{"x":2}\n{"x":4}\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicExec', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-n', 2, '-e',
		       'return (line < 3 ? "1" : "2")'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '1\n2\n',
			'1': '3\n4\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicExecJson', function (t)
{
	var sin = '{"x":1}\n{"x":2}\n{"x":3}\n{"x":4}\n';
	runTest({
		stdin: sin,
		opts: ['-n', 2, '-j', '-e',
		       'this.x < 3 ? "1" : "2"'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '{"x":1}\n{"x":2}\n',
			'1': '{"x":3}\n{"x":4}\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});

test('testExecWithoutReturn', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-n', 2, '-e',
		       'line < 3 ? "1" : "2"'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '1\n2\n',
			'1': '3\n4\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});

test('testExecWithTrailingSemicolon', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-n', 2, '-e',
		       'line < 3 ? "1" : "2";'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.equal(2, SERVER.requests.length);
		var reqs = transformRequests(t, SERVER.requests);
		t.deepEqual({
			'0': '1\n2\n',
			'1': '3\n4\n'
		}, reqs);
		t.ok(result.error === null);
		t.done();
	});
});
