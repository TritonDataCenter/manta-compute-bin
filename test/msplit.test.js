/*
 * tst.msplit.js: msplit tests
 */

var mod_fs = require('fs');
var mod_child_process = require('child_process');

var mod_bunyan = require('bunyan');

var helper = require('./helper.js');

var msplit = msplit = './bin/msplit';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'msplit.test.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var test = helper.test;

function runTest(opts, callback)
{
	var spawn = mod_child_process.spawn(msplit, opts.opts);
	var pid = spawn.pid;

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
		var files = {};
		if (!error) {
			for (var i = 0; i < opts.nReducers; ++i) {
				// Must match what's in msplit's msTmpFilePrefix
				var n = '/var/tmp/msplit.' + pid +
					'.' + i;
				files[i] = mod_fs.readFileSync(n, 'utf8');
			}
		}
		var result = {
			stdout: stdout,
			stderr: stderr,
			files: files,
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
		opts: ['-t', '-n', 2],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '1\n3\n',
			'1': '2\n4\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicAltField', function (t)
{
	var sin = ['1,2,3',
		    '1,2,2',
		    '1,1,1',
		    '1,3,4'].join('\n');

	runTest({
		stdin: sin,
		opts: ['-t', '-n', 2, '-f', '3', '-d', ','],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '1,2,3\n1,1,1\n',
			'1': '1,2,2\n1,3,4\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicJson', function (t)
{
	var sin = '{"x":1}\n{"x":2}\n{"x":3}\n{"x":4}\n';
	runTest({
		stdin: sin,
		opts: ['-t', '-n', 2, '-j', '-f', 'x'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '{"x":1}\n{"x":3}\n',
			'1': '{"x":2}\n{"x":4}\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicExec', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-t', '-n', 2, '-e',
		       'return (line < 3 ? "1" : "2")'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '1\n2\n',
			'1': '3\n4\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});

test('testBasicExecJson', function (t)
{
	var sin = '{"x":1}\n{"x":2}\n{"x":3}\n{"x":4}\n';
	runTest({
		stdin: sin,
		opts: ['-t', '-n', 2, '-j', '-e',
		       'this.x < 3 ? "1" : "2"'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '{"x":1}\n{"x":2}\n',
			'1': '{"x":3}\n{"x":4}\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});

test('testExecWithoutReturn', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-t', '-n', 2, '-e',
		       'line < 3 ? "1" : "2"'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '1\n2\n',
			'1': '3\n4\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});

test('testExecWithTrailingSemicolon', function (t)
{
	var sin = '1\n2\n3\n4\n';
	runTest({
		stdin: sin,
		opts: ['-t', '-n', 2, '-e',
		       'line < 3 ? "1" : "2";'],
		nReducers: 2
	}, function (result) {
		t.equal(0, result.code);
		t.deepEqual({
			'0': '1\n2\n',
			'1': '3\n4\n'
		}, result.files);
		t.ok(result.error === null);
		t.done();
	});
});
