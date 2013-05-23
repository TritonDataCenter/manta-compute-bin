/*
 * tst.maggr.js: maggr tests
 */

var mod_fs = require('fs');
var mod_child_process = require('child_process');

var mod_bunyan = require('bunyan');
var helper = require('./helper.js');

var maggr = './bin/maggr';
var tmpdir = process.env['TMPDIR'] || '/tmp';

var log = new mod_bunyan({
    'name': 'tst.maggr.js',
    'level': process.env['LOG_LEVEL'] || 'debug'
});

var test = helper.test;

var SAMPLE_STDIN = [
	'foo baz 1 2',
	'bar baz 3 4',
	'foo bng 5 6'
].join('\n');

function runTest(opts, callback)
{
	var spawn = mod_child_process.spawn(maggr, opts.opts);

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
			stdin: opts.stdin,
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

test('testBadColumnArgs', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1', 'key']
	}, function (result) {
		t.equal(2, result.code);
		t.done();
	});
});

test('testOpList', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', 'sum']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 6 8',
			'bar 3 4',
			''
			].join('\n'), result.stdout);
		t.done();
	});
});

test('testOpListWithStringColumn', function (t) {
	runTest({
		stdin: ['foo 1 1',
			'bar 1 1',
			'foo baz 1',
			'foo 1 1',
			'bar 1 1',
			''
		       ].join('\n'),
		opts: ['-c1=key', 'sum']
	}, function (result) {
		t.equal(1, result.code);
		t.equal(['foo 2 2',
			'bar 2 2',
			''
			].join('\n'), result.stdout);
		t.equal('Non-number in non-key column 2. line: foo baz 1\n',
			result.stderr);
		t.done();
	});
});

test('testOpListWithStringColumnFirstLine', function (t) {
	runTest({
		stdin: ['foo baz 1',
			'bar 1 1',
			'foo 1 1',
			'foo 1 1',
			'bar 1 1',
			''
		       ].join('\n'),
		opts: ['-c1=key', 'sum']
	}, function (result) {
		t.equal(1, result.code);
		// bar is the first valid line above...
		t.equal(['bar 2 2',
			'foo 2 2',
			''
			].join('\n'), result.stdout);
		t.equal('Non-number in non-key column 2. line: foo baz 1\n',
			result.stderr);
		t.done();
	});
});

test('testNoColumnDefForSomeColumns', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c4=sum']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 8',
			'bar 4',
			''
			].join('\n'), result.stdout);
		t.done();
	});
});

test('testList', function (t)
{
	runTest({
		stdin: '',
		opts: ['-l']
	}, function (result) {
		t.equal(0, result.code);
		/**
		 * Note: if you ever have to modify this, make sure:
		 *     1) You modify the next test (testAllOperations)
		 *     2) You update any docs, etc for the new operation
		 *	(since the main purpose of this test is to catch
		 *	 additions/ommissions)
		 */
		t.equal('key nop count max mean min range sum\n',
			result.stderr);
		t.done();
	});
});

test('testAllOperations', function (t)
{
	runTest({
		stdin: ['foo 19',
			'foo 3',
			'foo 7',
			'foo 8',
			'foo 12'
		       ].join('\n'),
		opts: ['-c1=key',
		       '-c2=count,max,mean,min,range,sum']
	}, function (result) {
		t.equal(0, result.code);
		t.equal('foo 5,19,9.8,3,16,49\n',
			result.stdout);
		t.done();
	});
});

test('allNoOp', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=nop', '-c2=nop', '-c3=nop', '-c4=nop']
	}, function (result) {
		t.equal(0, result.code);
		t.equal('\n', result.stdout);
		t.done();
	});
});

test('testSimpleSum', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=sum', '-c4=sum']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 6 8',
			'bar 3 4',
			''
			].join('\n'), result.stdout);
		t.done();
	});
});

test('testInputSeparator', function (t) {
	runTest({
		stdin: SAMPLE_STDIN.replace(/ /g, '~'),
		opts: ['-c1=key', '-c2=nop', '-c3=sum', '-c4=sum', '-d', '~']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 6 8',
			'bar 3 4',
			''
			].join('\n').replace(/ /g, '~'), result.stdout);
		t.done();
	});
});

test('testOutputSeparator', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=sum', '-c4=sum', '-o', '~']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 6 8',
			'bar 3 4',
			''
			].join('\n').replace(/ /g, '~'), result.stdout);
		t.done();
	});
});

test('testReadingFromFileNotStdin', function (t) {
	var fileName = '/tmp/maggr.test.' + process.pid;
	mod_fs.writeFileSync(fileName, SAMPLE_STDIN);
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=sum', '-c4=sum',
		       '-f', fileName]
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 6 8',
			'bar 3 4',
			''
			].join('\n'), result.stdout);
		mod_fs.unlinkSync(fileName);
		t.done();
	});

});

test('testMultipleOpsMultipleCols', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=sum,count', '-c4=sum,range']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo 6,2 8,4',
			'bar 3,1 4,0',
			''
			].join('\n'), result.stdout);
		t.done();
	});
});

test('testMultipleOpsMultipleColsSeparator', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=sum,count', '-c4=sum,range',
		       '-i', '~']
	}, function (result) {
		t.equal(0, result.code);
		/* JSSTYLED */
		var creg = /,/g;
		t.equal(['foo 6,2 8,4',
			'bar 3,1 4,0',
			''
			].join('\n').replace(creg, '~'), result.stdout);
		t.done();
	});
});

test('testColumnOutOfBounds', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=nop', '-c4=nop', '-c5=sum']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['foo',
			'bar',
			''
			].join('\n'), result.stdout);
		t.done();
	});
});

test('testColumnNegative', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=key', '-c2=nop', '-c3=nop', '-c4=nop', '-c-1=sum']
	}, function (result) {
		t.equal(2, result.code);
		t.done();
	});
});

test('testAlternateKey', function (t) {
	runTest({
		stdin: SAMPLE_STDIN,
		opts: ['-c1=nop', '-c2=key', '-c3=sum', '-c4=sum']
	}, function (result) {
		t.equal(0, result.code);
		t.equal(['baz 4 6',
			'bng 5 6',
			''
			].join('\n'), result.stdout);
		t.done();
	});
});
