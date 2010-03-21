
function success (value) {
    // return a defer that has completed...
    return value;
}

function async (fn) {
    return function () {
        var g = fn ();
        try {
            while (1) {
                var captured = g.next ();
            }
        } catch (StopIteration) {
            return success ();
        }
    }
}

var badger = async (function () {
    log ("entering badger function and yielding");
    yield;
    log("continuing badger function");
});

badger ();

