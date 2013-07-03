/*
 * lib/common.js: common methods for saving data to Manta.
 */

var mod_assert = require('assert');
var mod_fs = require('fs');
var mod_memorystream = require('memorystream');
var mod_path = require('path');
var mod_retry = require('retry');
var mod_verror = require('verror');

var VError = mod_verror.VError;

exports.mantaFileSave = mantaFileSave;
exports.mantaObjectNameEncode = mantaObjectNameEncode;

/*
 * Upload a file to Manta.  Automatically does "mkdir -p" if the parent
 * directory does not exist.  Arguments:
 *
 *    client		Manta client object
 *
 *    filename		Path of file to upload.  This file should not be
 *    			modified during this operation.  (This function is only
 *    			called by consumers who know there is nothing else
 *    			operating on the file.)
 *
 *    key		Object key to create
 *
 *    headers		Additional headers for PUT request
 *
 *    log		Bunyan logger
 *
 *    iostream		'stdout', 'stderr', or 'core'
 *
 *    retry		Retry policy (node-retry configuration)
 *    (optional)
 *
 * The default retry policy tries up to 3 times.
 */
function mantaFileSave(args, callback, nomkdirp)
{
	var operation = mod_retry.operation(args['retry'] || {
	    'retries': 2, /* 2 retries = 3 attempts */
	    'factor': 2,
	    'minTimeout': 1000,
	    'maxTimeout': 3000
	});

	/*
	 * There are two levels of retry here for different purposes.
	 * mantaFileSave() is the only public function, and it (by default)
	 * retries the whole operation with backoff if the attempt fails.  But
	 * each individual attempt may also retry once with no backoff if it
	 * finds it needs to "mkdirp" to create the output object's parent
	 * directories.  This "mkdirp" can fail for the same reason any Manta
	 * operation can fail, and it gets retried with backoff with the
	 * top-level retry.
	 */
	operation.attempt(function () {
		mantaFileSaveAttempt(args, function (err) {
			if (!operation.retry(err))
				callback(err);
		}, nomkdirp);
	});
}

function mantaFileSaveAttempt(args, callback, nomkdirp)
{
	mod_assert.ok(args['client'], '"client" is required');
	mod_assert.ok(args['log'], '"log" is required');
	mod_assert.equal(typeof (args['filename']), 'string',
	    '"filename" must be a string');
	mod_assert.equal(typeof (args['key']), 'string',
	    '"key" must be a string');
	mod_assert.ok([ 'stdout', 'stderr', 'core' ].indexOf(
	    args['iostream']) != -1,
	    'iostream must be "stdout", "stderr", or "core"');

	var filename = args['filename'];

	mod_fs.stat(filename, function (err, stat) {
		if (err) {
			callback(new VError(err, 'stat "%s"', filename));
			return;
		}

		var instream;

		if (stat['size'] === 0) {
			instream = new mod_memorystream('',
			    { 'writable': false });
			mantaStreamSave({
			    'client': args['client'],
			    'stream': instream,
			    'size': 0,
			    'key': args['key'],
			    'headers': args['headers'],
			    'rIdx': args['rIdx'],
			    'iostream': args['iostream']
			}, callback, nomkdirp);
			return;
		}

		var opened = false;
		instream = mod_fs.createReadStream(filename);

		instream.on('error', function (suberr) {
			callback(new VError(suberr, '%s "%s"',
			    opened ? 'read' : 'open', filename));
		});

		instream.on('open', function () {
			opened = true;

			mantaStreamSave({
			    'client': args['client'],
			    'stream': instream,
			    'size': stat['size'],
			    'key': args['key'],
			    'headers': args['headers'],
			    'rIdx': args['rIdx'],
			    'iostream': args['iostream']
			}, callback, nomkdirp);
		});
	});
}

function mantaStreamSave(args, callback, nomkdirp)
{
	mod_assert.ok(args['client'], '"client" is required');
	mod_assert.ok(args['stream'], '"stream" is required');
	mod_assert.equal(typeof (args['size']), 'number',
	    '"size" must be a number');
	mod_assert.equal(typeof (args['key']), 'string',
	    '"key" must be a string');

	var client = args['client'];
	var key = args['key'];

	var options = {
	    'size': args['size'],
	    'headers': {}
	};

	if (args['headers']) {
		for (var header in args['headers'])
			options['headers'][header] = args['headers'][header];
	}

	options['headers']['x-manta-stream'] = args['iostream'];

	if (args['rIdx'] !== undefined) {
		options['headers']['x-manta-reducer'] = args['rIdx'];
	}

	client.put(key, args['stream'], options, function (err) {
		if (!err) {
			callback();
			return;
		}

		if (nomkdirp || err.name != 'DirectoryDoesNotExistError') {
			callback(err);
			return;
		}

		client.mkdirp(mod_path.dirname(key), function (err2) {
			if (err2) {
				callback(new VError(err2, 'failed to mkdirp'));
				return;
			}

			mantaStreamSave(args, callback, true);
		});
	});
}

function mantaObjectNameEncode(objname)
{
	return (objname.split('/').map(encodeURIComponent).join('/'));
}
