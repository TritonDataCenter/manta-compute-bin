msplit 1 "May 2013" Manta "Manta Compute Bin"
============================================

NAME
----

msplit - split the output stream for the current task to many reducers.

SYNOPSIS
--------

`msplit` [-n number_of_reducers] [-d delimiter] [-f field_list] [-j]
         [-e javascript]

DESCRIPTION
-----------

Reads content from stdin and outputs to the number of `mpipe` processes for the
number of reducers that are specified.  The field list is an optional list of
fields that are used as input to the partitioning function.  The field list
defaults to 1.  The delimiter is used to split the line to extract the key
fields.  The delimiter defaults to (tab).  For example, this will split stdin by
comma and use the 5th and 3rd fields for the partitioning key, going to 4
reducers:

    $ msplit -d ',' -f 5,3 -n 4

Using to parse text:

The -d and -f fields are optional and specify the delimiter to use when
splitting fields and the field list to use to construct the key used to map to
reducers.  The delimiter defaults to (tab).  The field defaults to 1.  If the
field does not exist (if it is out of range, for example), it will simply not be
part of the partitioning key.  The implications of this is that if all fields
are invalid all output will go to the same reducer.

For example, to split on comma and use the 5th and 3rd fields to demux to 4
reducers:

    $ ... | msplit -d ',' -f 5,3 -n 4

Using to parse json (using the -j option):

The -f field is required and is used to specify the fields that will be used to
map the record to a reducer.  Similar to text processing, if the field doesn't
exist, the field will be ignored.

For example, to split json records on the id and type fields to demux to 4
reducers:

    $ ... | msplit -j -f id,type -n 4

Using the exec option (-e):

You can also write arbitrary javascript to work over your records.  The exec
line given will become the function body for the following function signature:

    function (line) { ... }

A string must be returned from the function.  To reduce the size of one-liners,
if msplit detects no 'return', it will enclose the code in 'return ( ... )'.
For example, if you are parsing text and want the partition key to be the first
16 characters, either of these will work:

    $ ... | msplit -e "return line.substring(0,16)" -n 4
    $ ... | msplit -e "line.substring(0,16)" -n 4

For multiple statements, you must include a 'return'.

If you are using the -j option, the object will be parsed as json and bound to
'this' when the function is invoked.  For example, given this object:

    {"id":"1234567890-22-0987654321", "name":...}

You can use the first 9 characters of the id field with:

    $ ... | msplit -e "this.id.substring(0,9)" -n 4

EXAMPLES
--------

    $ msplit -d ',' -f 5,3 -n 4
    $ msplit -j -f id,type -n 4
    $ msplit -e "return line.substring(0,16)" -n 4
    $ msplit -j -e "this.id.substring(0,9)" -n 4
    $ msplit -i -j -e "this.latency % 4" -n 4

OPTIONS
-------

`-d`
  Specify the delimiter for text records.

`-e`
  Execute as javascript to derive the partitioning key.

`-f`
  List of fields to use as the partitioning key.  If processing delimited text,
  must be a number.  If processing with the -j option, must be a field in the
  json object.

`-i`
  Rather than splitting to reducers based on the hash of the partition key,
  parse the field as an integer and use it as the literal index to the reducer.
  Must be between 0 and number_of_reducers - 1.  Note that if you use this
  option you are taking on the resposibility of even distribution of your data
  between reducers.

`-j`
  Process the input as newline-separated json objects.

`-n`
  Number of reducers.  Should match the number of reducers for your job.

BUGS
----

Report bugs at [Github](https://github.com/joyent/manta-compute-bin/issues)
