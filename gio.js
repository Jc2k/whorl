const Defer = imports.defer;
const GLib = imports.gi.GLib;

function Repository () { }
Repository.prototype = {
    "wrap_function": function (fn) {
        var cls = fn.parent ();
        var ns = cls.parent ();
        var async_name = String (fn.@name);
        var bare_name = async_name.substr(0, async_name.length - 6);
        var finish_name = bare_name + "_finish";
        var sync_name = bare_name + "_sync";

        print (cls.@name + ": " + bare_name);

        // for it to be wrappable, it must have a corresponding _finish method..
        if (!(cls.method.(@name == finish_name)))
            return;

        // for now, if it doesnt take an AsyncReadyCallback we ain't gonna wrap it in magic
        if (!(fn.parameters.parameter.type.(@name == "AsyncReadyCallback")))
            return;

        // figuring out where to splic in the callback
        var splice_point = 0;
        for each (var t in fn.parameters.parameter.type) {
            if (t.@name == "AsyncReadyCallback")
                break;
            splice_point ++;
        }

        var replacement = function () {
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

            // pass this callback to the _async function we are calling
            args.splice (splice_point, 0, callback);

            // Actually call the async function
            func.apply(this, args);

            return d;
        }

        var victim = imports.gi[ns.@name][cls.@name];
        victim[sync_name] = victim[bare_name];
        victim[bare_name] = replacement;
    },

    "wrap_class": function (cls) {
        for each (var f in cls.method) {
            if (f.@name.match ("_async$")) {
                if (f.@name.substr (-6, 6) != "_async")
                    continue;
                this.wrap_function (f);
            }
        }
    },

    "wrap_namespace": function (ns) {
        for each (var cls in ns.class) {
            this.wrap_class (cls);
        }
    },

    "wrap_repository": function (repo) {
        for each (var ns in repo.namespace) {
            this.wrap_namespace (ns);
        }
    },

    "wrap_file": function (file) {
        let [success, contents, len] = GLib.file_get_contents (file);
        contents.replace (/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // bug 336551
        var x = new XML (contents);
        print ("xml parsed");
        this.wrap_repository (x);
    }
};

(function () {
    var r = new Repository ();
    //r.wrap_namespace (xml.namespace);
    r.wrap_file ("/usr/share/gir-1.0/Gio-2.0.gir");

    var Gio = imports.gi.Gio;
    print ("fill" in Gio.BufferedInputStream);
    print ("fill_sync" in Gio.BufferedInputStream);
}) ();

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

