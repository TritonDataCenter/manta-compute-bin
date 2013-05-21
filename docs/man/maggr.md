maggr 1 "May 2013" Manta "Manta Compute Bin"
============================================

NAME
----

maggr - performs key-wise aggregation on plain text files.

SYNOPSIS
--------

`maggr` [-c#=[op list] -c#=[op list] ...]
        [-f file] [-d input delimiter] [-o output delimiter]
        [-i inner output delimiter] [op list]
`maggr` -l

DESCRIPTION
-----------

`maggr` produces statistics from text streams.  To get the current list of
supported aggregation functions, invoke `maggr -l`.

EXAMPLES
--------

    $ echo -e 'foo 1\nbar 1\nfoo 2\nfoo 5' | ./bin/maggr sum,mean
    foo 8,2.6666666666666665
    bar 1,1

OPTIONS
-------

`-c`
  Specify a list of operations to perform on a column.  Column numbers begin at
  1.  You can specify multiple operations, separated by a ','.  For example,
  to get the mean of the fifth field: `-c5=mean`.

`-d`
  String that separates the input columns.

`-f`
  Read from file instead of reading from stdin.

`-i`
  String that separates results for a single column when multiple operations
  are specified.

`-l`
  Lists supported operations.

`-o`
  String that separates the columns in the output.

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
