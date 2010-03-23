const Defer = imports.defer;

var xml = <repository>
    <namespace name="Gio">
      <class name="BufferedInputStream">
        <method name="fill_async">
        </method>
        <method name="fill_finish">
        </method>
      </class>
    </namespace>
  </repository>;

function Repository () { }
Repository.prototype = {
    "wrap_function": function (fn) {
        var cls = fn.parent ();
        var ns = cls.parent ();
        var async_name = fn.@name;
        var bare_name = fn.@name.substr(0, -6);
        var finish_name = bare_name + "_finish";
        var sync_name = bare_name + "_sync";

        if (!(cls.method.(@name == finish_name)))
            return;

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

            // need to splice something in in right pos
            // front, back = args[:pos], args[pos:]
            /// args = front + [callback] + back

            // Actuall call the async function
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
    }
};

(function () {
    var r = new Repository ();
    r.wrap_namespace (xml.namespace);
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

