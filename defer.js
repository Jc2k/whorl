
var assert = function (test) {
    if (!test) {
        throw "AssertionFAIL";
    }
}

if (typeof Function.prototype.bind == 'undefined') {
    Function.prototype.bind = function (context) {
        var fun = this;
        return function() {
            return fun.apply(context, arguments);
        };
    }
}

var Failure = function (result) {
    this.failure = result;
}

var ReturnValue = function (result) {
    this.value = result;
}

var Deferred = function () {
    this.callbacks = [];
    this.result = null;
    this.started = false;
}

Deferred.prototype = {
    addCallbacks: function (callback, args, errback, eargs) {
        cb = [callback, args ? args : []];
        eb = [callback, eargs ? args : []];
        this.callbacks.push ([cb, eb]);
        if (this.started)
            this._processCallbacks ();
    },

    addCallback: function (callable) {
        var args = Array.prototype.slice.call(arguments);
        args.shift ();
        this.addCallbacks (callable, args);
    },

    addErrback: function (callable) {
        var args = Array.prototype.slice.call(arguments);
        args.shift ();
        this.addCallbacks (null, null, callable, args);
    },

    addBoth: function (callable) {
        var args = Array.prototype.slice.call(arguments);
        args.shift ();
        // Add the same callable as a callback and an errback
        this.addCallbacks(callable, args, callable, args);
    },

    _processCallbacks: function () {
        while (this.callbacks.length > 0) {
            // unpack an error and callback from the queue
            [cb, eb] = this.callbacks.shift ();
            [callable, args] = this.result instanceof Failure ? cb : eb;

            // call the callback with .result as the first argument
            args.unshift (this.result);
            this.result = callable.apply(null, args);

            // if it returns a deferred then add a _continue callback
            if (this.result instanceof Deferred) {
                this.result.addBoth (this._continue.bind (this));
                break;
            }
        }
    },

    _continue: function (result) {
        this.result = result;
        this._processCallbacks ();
        return result; // fixme: no idea why im returning result
    },

    _start_callbacks: function (result) {
        if (this.started) {
            throw "OhBugger";
        }
        this.started = true;
        this._continue (result);
    },

    callback: function (result) {
        this._start_callbacks (result);
    },

    errback: function (result) {
        if (!(result instanceof Failure))
            result = new Failure (result);
        this._start_callbacks (result);
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

function wrap (callable) {
    return function () {
        try {
            var ret = callable.apply(this, arguments);
        } catch (e) {
            return fail (e);
        }
        return succeed (ret);
    }
}

function maybeDeferred (value) {
    if (value instanceof Deferred)
        return value;
    else
        return succeed (value);
}

function async (fn) {
    var process = function (result, g, deferred) {

        try {
            while (1) {
                if (result instanceof Deferred) {
                    result.addBoth (process, g, deferred);
                    return deferred;
                } else if (result instanceof Failure) {
                    g.throw (result);
                } else {
                    result = g.send (result);
                }
            }
        } catch (e if e instanceof ReturnValue) {
            deferred.callback (e.result);
            return deferred;
        } catch (e if e instanceof StopIteration) {
            deferred.callback ();
            return deferred;
        } catch (e) {
            deferred.errback (e);
            return deferred;
        }
    }

    return function () {
        g = fn ();
        result = g.next ();
        return process (result, g, new Deferred ());
    }
}

(function () {
    print("test_defer_succeed");
    var flag = true;
    var d = succeed (false);
    d.addCallback (function (result) {
        flag = result;
    });
    assert (flag == false);
}) ();

(function () {
    print("test_async_decorator");
    var flag = true;
    async (function () {
        flag = yield succeed (false);
    }) ();
    assert (flag == false);
}) ();


