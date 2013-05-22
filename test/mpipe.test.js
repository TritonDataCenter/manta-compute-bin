/*
 * tst.mpipe.js: mpipe tests
 *
 * Since mpipe isn't any more complicated than piping to a file and uploading,
 * this isn't testing a whole lot, but something is always better than nothing.
 */

var mod_fs = require('fs');
var mod_child_process = require('child_process');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var mpipe = './bin/mpipe';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'tst.mpipe.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var test = helper.test;

function runTest(opts, callback)
{
	var spawn = mod_child_process.spawn(mpipe, opts.opts);

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
		var file = null;
		var fileName = null;
		if (stdout.indexOf('/var/tmp') === 0) {
			fileName = stdout.replace('\n', '');
			file = mod_fs.readFileSync(fileName, 'utf8');
			mod_fs.unlinkSync(fileName);
		}
		var result = {
			stdout: stdout,
			stderr: stderr,
			file: file,
			fileName: fileName,
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
		opts: ['-t']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(sin, result.file);
		t.deepEqual({
			'code': 0,
			'file': sin,
			'stdout': result.fileName + '\n',
			'fileName': result.fileName,
			'stderr': 'saving stdin to ' + result.fileName + '\n',
			'error': null
		}, result);
		t.done();
	});
});
