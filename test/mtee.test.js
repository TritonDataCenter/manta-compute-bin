/*
 * tst.mtee.js: mtee tests
 */

var mod_fs = require('fs');
var mod_child_process = require('child_process');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var mtee = './bin/mtee';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'tst.mtee.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var test = helper.test;

function runTest(opts, callback)
{
	var spawn = mod_child_process.spawn(mtee, opts.opts);

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
		var file = '';
		if (opts.file) {
			file = mod_fs.readFileSync(opts.file, 'utf8');
		}
		var result = {
			stdout: stdout,
			stderr: stderr,
			file: file,
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
	var file = '/var/tmp/tst.mtee.js-testBasic';
	runTest({
		stdin: sin,
		opts: ['-t', file],
		file: file
	}, function (result) {
		t.equal(0, result.code);
		t.equal(sin, result.stdout);
		t.deepEqual({
			'code': 0,
			'file': sin,
			'stdout': sin,
			'stderr': '',
			'error': null
		}, result);
		t.done();
	});
});
