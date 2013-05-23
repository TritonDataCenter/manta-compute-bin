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

    $ echo -e '1 2\n3 4\n5 6\n7 8' | ./bin/maggr -c2=sum mean
    4 20

    $ echo -e '1 2 3\n4 5 6\n7 8 9' | ./bin/maggr -c2=sum,max mean,min
    4,1 15,8 6,3

    $ echo -e 'foo 1\nbar 1\nfoo 2\nfoo 5' | \
        ./bin/maggr -c1=key -c2=count,sum sum
    foo 3,8 12
    bar 1,1 3

    $ echo -e 'foo:1:2:3\nbar:4:5:6\nfoo:7:8:9\nbaz:10:11:12' | \
        ./bin/maggr -d ':' -o '-' -c1=key sum
    foo-8-10-12
    bar-4-5-6
    baz-10-11-12

    $ echo -e 'foo 1 2 3\nbar 4 5 6\nfoo 7 8 9\nbaz 10 11 12' | \
        ./bin/maggr -i "#" -c1=key -c2=sum,mean -c3=count
    foo 8#4 2
    bar 4#4 1
    baz 10#10 1

OPTIONS
-------

`-c`
  Specify a list of operations to perform on a column.  Column numbers begin at
  1.  You can specify multiple operations, separated by a ','.  For example,
  to get the mean of the fifth field: `-c5=mean`.

`-d`
  String that separates the input columns. Default is an empty space (" ").

`-f`
  Read from file instead of reading from stdin.

`-i`
  String that separates results for a single column when multiple operations
  are specified. Default is a comma (",").

`-l`
  Lists supported operations.

`-o`
  String that separates the columns in the output. Default is an empty space
  (" ") or the input delimiter as specified by `-d`.

OPERATIONS
----------

`key`
  Treats the column as a key column. Aggregation will be performed for each set
  of keys found in the specified key column(s).

`nop`
  Ignores the column.

`count`
  Counts the number of rows.

`max`
  Finds the maximum value.

`mean`
  Calulates the mean (average) value.

`min`
  Finds the minimum value.

`range`
  Calculates the range of the values in the column.

`sum`
  Sums all values in the column.

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
