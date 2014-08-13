mtee 1 "May 2013" Manta "Manta Compute Bin"
============================================

NAME
----

mtee - capture stdin and write to both stdout and a Manta object.

SYNOPSIS
--------

`mtee` [-c durability] [-H header: value ...] [manta object]

DESCRIPTION
-----------

`mtee` is like `mput`, but takes input on stdin instead of a file, and emits its
input on stdout as well, much like tee(1).

`mtee` is also similar to `mpipe`, except that the newly created object does
*not* become an output object for the current task, and using mtee does not
prevent stdout from being captured.

For example, this will capture the output of cmd to manta object
`~~/stor/tee.out` and still pipe what was coming from cmd to cmd2:

    $ cmd | mtee ~~/stor/tee.out | cmd2

The shortcut `~~` is equivalent to `/:login`
where `:login` is the account login name.


EXAMPLES
--------

    $ mtee ~~/stor/tee.out
    $ mtee -H 'Access-Control-Allow-Origin: *' ~~/stor/tee.out
    $ mtee -c 1 ~~/stor/tee.out

OPTIONS
-------

`-c [number]`
  Set the durability level for the object.  Defaults to 2.

`-H '[http-header]: [value]'`
  Headers to set on the resulting PUT request to Manta.  For example,
  `Access-Control-Allow-Origin: *`.

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
