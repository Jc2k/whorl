
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
    },

    addCallback: function (callable, args) {
        this.addCallbacks (callable, args);
    },

    addErrback: function (callable, args) {
        this.addCallbacks (null, null, callable, args);
    },

    addBoth: function (callable, args) {
        // Add the same callable as a callback and an errback
        this.addCallbacks(callable, args, callable, args);
    },

    _start_callbacks: function (result) {
        if (this.started) {
            throw "OhBugger";
        }
        this.started = true;
        this._continue (result);
    },

    _continue: function (result) {
        this.result = result;
        this._processCallbacks ();
        return result; // fixme: no idea why im returning result
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
                this.result.addBoth (this._continue);
                break;
            }
        }
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

function maybeDeferred (value) {
    if (value instanceof Deferred)
        return value;
    else
        return succeed (value);
}

function async (fn) {
    var process = function (result, g, deferred) {
        try {
            result = g.next ();
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
        return process (null, fn (), new Deferred ());
    }
}

var badger = async (function () {
    print ("entering badger function and yielding");
    var a = yield succeed (20);
    print ("continuing badger function");
});

badger ();

