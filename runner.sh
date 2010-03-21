if [ -f /usr/bin/smjs ] ; then
    smjs -v 170 defer.js
else
    GJS_DEBUG_TOPICS="JS LOG" GJS_DEBUG_OUTPUT=stderr LD_LIBRARY_PATH=/usr/lib/xulrunner-1.9.1.8/ gjs defer.js
fi
