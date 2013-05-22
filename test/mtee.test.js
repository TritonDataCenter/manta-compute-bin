/*
 * tst.mtee.js: mtee tests
 */

var mod_child_process = require('child_process');
var mod_fs = require('fs');
var mod_http = require('http');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var mtee = './bin/mtee';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'tst.mtee.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var after = helper.after;
var before = helper.before;
var test = helper.test;

var PORT = 9876;
var SERVER = null;
var MANTA_URL = 'http://localhost:' + PORT;

function runTest(opts, callback)
{
	var env = {
		env: {
			'MANTA_URL': MANTA_URL,
			'MANTA_NO_AUTH': 'true'
		}
	};

	var spawn = mod_child_process.spawn(mtee, opts.opts, env);

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
	var path = '/MANTA_USER/stor/mtee.txt';
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: [path]
	}, function (result) {
		t.equal(0, result.code);
		t.equal(sin, result.stdout);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(sin, req.body);
		// Should *not* be reducer output.
		t.ok(req.headers['x-marlin-stream'] === undefined);
		t.equal(path, req.url);
		t.done();
	});
});

test('testAddHeaders', function (t)
{
	var path = '/MANTA_USER/stor/mtee.txt';
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-H', 'Access-Control-Origin: *', path]
	}, function (result) {
		t.equal(0, result.code);
		t.equal(sin, result.stdout);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(sin, req.body);
		// Should *not* be reducer output.
		t.ok(req.headers['x-marlin-stream'] === undefined);
		t.ok('*', req.headers['access-control-origin']);
		t.equal(path, req.url);
		t.done();
	});
});
