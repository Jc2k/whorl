
whorl is just a bit of code to play with when i'm bored. It's like a mini version of the core bits of Twisted, but in JavaScript.

It has 2 ideas about what it wants to be when it grows up. It would like to be part of the GNOME desktop, helping users write asynchronous code with a simple almost synchronous coding style.

    var print_contents = Defer.async( function (file) {
        var in_stream = yield file.read ();
        var bytes = yield in_stream.read (4096);
        while (bytes) {
            print (bytes);
            bytes = yield in_stream.read (4096);
        }
    });

It would also like to be part of the wave of JavaScript on the server - it would like to grow up to be like its big brother, Twisted.

    var handle_POST = Defer.async( function () {
        try {
            var page = yield WebClient.getPage ("http://www.google.com/search?q=turnips");
        } catch (e if e instanceof HTTP404) {
            print ("Error callbacks in async code even get mapped to exceptions :D");
        }

        do_stuff_to_page (page);

        Defer.returnValue (page);
    });

Of course, it works the same for both use cases and the difference is just the integration wrappers built on top of the respective client and server side frameworks...


