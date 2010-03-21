

var Deferred = function () {}
Deferred.prototype = {
    addCallbacks: function (callback, args, errback, args) {
    },

    addCallback: function (callable, args) {
    },

    addErrback: function (callable, args) {
    },

    addBoth: function (callable, args) {
        // Add the same callable as a callback and an errback
    },

    callback: function (result) {
    },

    errback: function (result) {
    },
}

function fail (value) {
    var d = new Deferred ();
    d.errback (value);
    return d;
}

function succeed (value) {
    var d = new Deferred ();
    d.callback (value);
    return d;
}

function maybeDeferred (value) {
    if (isinstance (value, Deferred))
        return value;
    else
        return succeed (value);
}

function async (fn) {
    var process = function (result, g, deferred) {
        try {
            result = g.next ();
            while (1) {
                if (isinstance (result, Deferred)) {
                    result.addBoth (process, g, deferred);
                    return deferred;
                } else if (isinstance (result, Failure)) {
                    g.throw (result);
                } else {
                    result = g.send (result);
                }
            }
        } catch (e if e == "ReturnValue") {
            deferred.callback (); // FIXME: Need to capture return value
            return deferred;
        } catch (e if e =="StopIteration") {
            deferred.callback ();
            return deferred;
        } catch (e) {
            deferred.errback (e);
            return deferred;
        }
    }

    return function () {
        return process (null, fn (), new Deferred ());
    }
}

var badger = async (function () {
    print ("entering badger function and yielding");
    var a = yield succeed (20);
    print ("continuing badger function");
});

badger ();

