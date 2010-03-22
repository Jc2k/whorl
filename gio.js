const Defer = imports.defer;
//
// This is a brain dump of something i'd like to land in GNOME gjs or seed...
//

var gio_wrapper = function (func, finish_func, pos) {
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

var gio_class_wrapper = function (cls) {
    for (key in cls) {
        if (key.substr(-6, 6) == "_async") {
            var replace_method = key.substr(0, -6);
            var final_method = replace_method + "_finish";
            var sync_method = replace_method + "_sync";

            if (!(final_method in cls) || sync_method in cls)
                continue;

            cls[sync_method] = cls[replace_method];
            cls[replace_method] = gio_wrapper (cls[key], cls[final_method]);
        }
    }
}

var print_contents = Defer.async( function (file) {
    var in_stream = yield file.read ();
    var bytes = yield in_stream.read (4096);
    while (bytes) {
        print (bytes);
        bytes = yield in_stream.read (4096);
    }
});

// it is left as an exercise for the reader to write the equivalent code without
// the async wrapper...

