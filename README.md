## Manta Compute Bin

[manta-compute-bin](http://joyent.github.com/manta-compute-bin) is a collection
of utilities that are on the `$PATH` in a Manta compute job.

If you aren't familiar with Manta, please see [the Manta landing
page](http://www.joyent.com/manta).

## Introduction

Each of these utilities aids in proceesing and moving data around within a Manta
compute job.  Recall that each phase of a Manta job is expressed in terms of a
Unix command.  These utilities are invoked as part of the job `exec` command.
For example, if you had the following as your `exec` line:

    grep foo | cut -f 4 | sort | uniq -c

And needed to preserve the `grep foo` output, you could use the `mtee` command
to capture that part of the pipeline to a Manta object:

   grep foo | mtee /$MANTA_USER/stor/grep_foo.txt | cut -f 4 | sort | uniq -c

## Utilities

The current set of utilities:

1. [`maggr`](docs/man/maggr.md) - Performs key-wise aggregation on plain text
files.
1. [`mcat`](docs/man/mcat.md) - Emits the named Manta object as an output for
the current task.
1. [`mpipe`](docs/man/mpipe.md) - Output pipe for the current task.
1. [`msplit`](docs/man/msplit.md) - Split the output stream for the current
task to many reducers.
1. [`mtee`](docs/man/mtee.md) - Capture stdin and write to both stdout and a
Manta object.

Detailed documentation that can be found by clicking one of the command names
above.

## Testing in Manta Compute
If you are testing changes or forked this repository, you can upload and run
your changes in Manta Compute with something like:

   $ make bundle
   $ mput -f manta-compute-bin.tar.gz /$MANTA_USER/stor/manta-compute-bin.tar.gz
   $ echo ... | mjob create \
     -s /$MANTA_USER/stor/manta-compute-bin.tar.gz \
     -m "cd /assets/ && gtar -xzf $MANTA_USER/stor/manta-compute-bin.tar.gz &&\
         cd manta-compute-bin && ./bin/msplit -n 3" \
     -r "cat" --count 3

## License

The MIT License (MIT)
Copyright (c) 2012 Joyent

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Bugs

See <https://github.com/joyent/manta-compute-bin/issues>.
