mpipe 1 "May 2013" Manta "Manta Compute Bin"
============================================

NAME
----

mpipe - advanced output pipe for the current task

SYNOPSIS
--------

`mpipe` [-p] [-r rIdx] [-H header: value ...] [manta path]

DESCRIPTION
-----------

Each invocation of mpipe reads data from stdin, potentially buffers it to local
disk, and saves it as task output.  If a Manta path is given, the output is
saved to that path.  Otherwise, the object is stored with a unique name in the
job's directory.  If -p is given, required parent directories are automatically
created (like "mkdir -p").

If you use mpipe in a task, the task's stdout will not be captured and saved as
it is by default.

As a simple example,

    $ wc | mpipe

is exactly equivalent to just:

    $ wc

since both capture the stdout of wc and emit it as a single output object.  But
you use mpipe for several reasons:

* **Naming**: Objects created through automatic stdout capture or through mpipe
  with no arguments are automatically given unique names.  You can control the
  name yourself by specifying an argument to mpipe:

    $ wc | mpipe ~~/stor/count

The shortcut `~~` is equivalent to `/:login`
where `:login` is the account login name.


A job that creates thumbnails from images might use `MANTA_INPUT_OBJECT` to
infer the desired path for the thumbnail (e.g.,
`${MANTA_INPUT_OBJECT}-thumb.png`) and then use mpipe to store the output there.
* **Multiple outputs**: you can invoke mpipe as many times as you want from a
  single task to emit more than one object for the next phase (or as a final job
  output).  A job that chunks up daily log files into hourly ones for subsequent
  per-hour processing would use this to emit 24 outputs for each input.
* **Special headers**: You can specify headers to be set on output objects using
  the "-H" option to mpipe, which behaves exactly like the same option on the
  Manta CLI tool `mput`.
* **Reducer routing**: Finally, in jobs with multiple reducers in a single
  phase, you can specify which reducer a given output object should be routed to
  using the "-r" option to mpipe.  See "Multiple reducers" below.

EXAMPLES
--------

    $ wc | mpipe -H 'Access-Control-Allow-Origin: *' ~~/public/wc.txt
    $ .. | mpipe -r 2

OPTIONS
-------

`-f [file name]`
  Treats the contents of `file name` as stdin.

`-H '[http-header]: [value]'`
  Headers to set on the resulting PUT request to Manta.  For example,
  `Access-Control-Allow-Origin: *`.

`-p`
  Turns off retries if a PUT fails.

`-r`
  Send the output to a specific reducer.

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
