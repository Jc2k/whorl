//
// This is a brain dump of something i'd like to land in GNOME gjs or seed...
//

var gio_wrapper = function (func, finish_func, pos=-1) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        var d = Deferred ();

        // Generate a callback to collect the result from the C library
        var callback = function (obj, async_result) {
            try {
                var result = finish_func.call (this, async_result);
            } catch (e) {
                d.errback (e);
                return;
            }
            d.callback (result);
        }

        // need to splice something in in right pos
        // front, back = args[:pos], args[pos:]
        /// args = front + [callback] + back

        // Actuall call the async function
        func.apply(this, args);

        return d;
    }
}

// the goal is to do this for every library...
// gio.File.append_to_sync = gio.File.apppend_to;
// gio.File.append_to = gio_wrapper (gio.File.append_to_async, gio.File.append_to_finish);

// or
// gio.File.append_to_deferred = gio_wrapper();

// and then we can write code like this:

var print_contents = async( function (file) {
    var in_stream = yield file.read ();
    var bytes = yield in_stream.read (4096);
    while (bytes) {
        print (bytes);
        bytes = yield in_stream.read (4096);
    }
});

// it is left as an exercise for the reader to write the equivalent code without
// the async wrapper...

