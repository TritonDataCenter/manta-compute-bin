/*
 * tst.mpipe.js: mpipe tests
 */

var mod_child_process = require('child_process');
var mod_fs = require('fs');
var mod_http = require('http');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var mpipe = './bin/mpipe';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'tst.mpipe.js',
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
			'MANTA_NO_AUTH': true,
			'MANTA_OUTPUT_BASE': MANTA_OUTPUT_BASE
		}
	};

	var spawn = mod_child_process.spawn(mpipe, opts.opts, env);

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
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: []
	}, function (result) {
		t.equal(0, result.code);
		t.ok(!result.error);
		t.ok(result.stdout.indexOf(MANTA_OUTPUT_BASE) === 0);
		t.ok(result.stderr.indexOf('/var/tmp/mpipe.') !== -1);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(sin, req.body);
		t.done();
	});
});

test('testAddHeaders', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-H', 'Access-Control-Origin: *']
	}, function (result) {
		t.equal(0, result.code);
		t.ok(!result.error);
		t.ok(result.stdout.indexOf(MANTA_OUTPUT_BASE) === 0);
		t.ok(result.stderr.indexOf('/var/tmp/mpipe.') !== -1);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(sin, req.body);
		t.equal('*', req.headers['access-control-origin']);
		t.done();
	});
});

test('testTargetedReducer', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-r', '1']
	}, function (result) {
		t.equal(0, result.code);
		t.ok(!result.error);
		t.ok(result.stdout.indexOf(MANTA_OUTPUT_BASE) === 0);
		t.ok(result.stderr.indexOf('/var/tmp/mpipe.') !== -1);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(sin, req.body);
		t.equal('1', req.headers['x-manta-reducer']);
		t.done();
	});
});

test('testNamedOutput', function (t)
{
	var path = '/MANTA_USER/stor/out.txt';
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: [path]
	}, function (result) {
		t.equal(0, result.code);
		t.ok(!result.error);
		t.ok(result.stdout.indexOf(path) === 0);
		t.ok(result.stderr.indexOf('/var/tmp/mpipe.') !== -1);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(sin, req.body);
		t.ok('stdout', req.headers['x-manta-stream']);
		t.ok(path, req.url);
		t.done();
	});
});

test('testFileUpload', function (t)
{
	var fileName = '/var/tmp/mpipe.test.file.' + process.pid;
	var data = '1\n2\n3\n4\n';
	mod_fs.writeFileSync(fileName, data);
	runTest({
		stdin: '',
		opts: ['-f', fileName]
	}, function (result) {
		t.equal(0, result.code);
		t.ok(!result.error);
		t.ok(result.stdout.indexOf(MANTA_OUTPUT_BASE) === 0);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(data, req.body);
		t.ok('stdout', req.headers['x-manta-stream']);
		t.done();
	});
});

test('testFileUploadTargetingReducer', function (t)
{
	var fileName = '/var/tmp/mpipe.test.file.' + process.pid;
	var data = '1\n2\n3\n4\n';
	mod_fs.writeFileSync(fileName, data);
	runTest({
		stdin: '',
		opts: ['-f', fileName, '-r', 1]
	}, function (result) {
		t.equal(0, result.code);
		t.ok(!result.error);
		t.ok(result.stdout.indexOf(MANTA_OUTPUT_BASE) === 0);
		t.equal(1, SERVER.requests.length);
		var req = SERVER.requests[0];
		t.equal(data, req.body);
		t.ok('stdout', req.headers['x-manta-stream']);
		t.equal('1', req.headers['x-manta-reducer']);
		t.done();
	});
});

test('testFileDoesntExist', function (t)
{
	runTest({
		stdin: '',
		opts: ['-f', '/var/tmp/mpipetestfiledoesntexist']
	}, function (result) {
		t.equal(2, result.code);
		t.done();
	});
});
