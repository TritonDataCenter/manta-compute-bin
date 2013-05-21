mtee 1 "May 2013" Manta "Manta Compute Bin"
============================================

NAME
----

mtee - capture stdin and write to both stdout and a Manta object.

SYNOPSIS
--------

`mtee` [manta object]

DESCRIPTION
-----------

`mtee` is like `mput`, but takes input on stdin instead of a file, and emits its
input on stdout as well, much like tee(1).

`mtee` is also similar to `mpipe`, except that the newly created object does
*not* become an output object for the current task, and using mtee does not
prevent stdout from being captured.

For example, this will capture the output of cmd to manta object
`/$MANTA_USER/stor/tee.out` and still pipe what was coming from cmd to cmd2:

    $ cmd | mtee /$MANTA_USER/stor/tee.out | cmd2

EXAMPLES
--------

    $ mtee /$MANTA_USER/stor/tee.out

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
