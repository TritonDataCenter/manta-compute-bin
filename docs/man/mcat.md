mcat 1 "May 2013" Manta "Manta Compute Bin"
============================================

NAME
----

mcat - emit objects by reference

SYNOPSIS
--------

`mcat` FILE ...

DESCRIPTION
-----------

`mcat` emits the contents of a Manta object as an output of the current task,
but without actually fetching the data.  For example:

    mcat ~~/stor/scores.csv

emits the object `~~/stor/scores.csv` as an input to the next phase
(or as a final job output), but *without* actually downloading it as part of the
current phase.

The shortcut `~~` is equivalent to `/:login`
where `:login` is the account login name.

As with mpipe, when you use mcat, the task's stdout will not be captured and
saved as it is by default.

mcat is particularly useful when you tend to run many jobs on the same large set
of input objects.  You can store the set of objects in a separate "manifest"
object and have the first phase of your job process that with "mcat".  So
instead of this:

     $ mfind ~~/public | mjob create -m wc

which may take a long time if `mfind` returns a lot of objects, you could do
this once:

    $ mfind ~~/public > /var/tmp/inputs
    $ mput -f /var/tmp/inputs ~~/public/inputs

And then for subsequent jobs, just do this:

    $ echo ~~/public/inputs | mjob create -m "xargs mcat" -m wc)

This is much quicker to kick off, since you're just uploading one object name.
The first phase invokes "mcat" on lines from ~~/public/inputs.  Each
of these lines is treated as a Manta path, and the corresponding object becomes
an input to the second phase.

The object path is not resolved until it's processed for the next phase.  So if
you specify an object that does not exist, this will produce a
ResourceNotFoundError for the phase *after* the `mcat`.  Similarly, if you
specify an object that you don't have access to, you'll get an error in the next
phase when you try to use it.

EXAMPLES
--------

    $ mcat ~~/stor/scores.csv

OPTIONS
-------

`-r`
  Specify the reducer the Manta object should be directed to.

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
