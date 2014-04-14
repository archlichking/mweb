var internals = {};

internals.WindowEventBinder = function() {
    // use html5 localStorage
    localStorage.triggeredEvents = '{}';
};

internals.WindowEventBinder.prototype.bindEvent = function(event, func) {
    // this.events_[event] = func;
    window.addEventListener(event, function(eventMessage) {
        var result = func(eventMessage);
        // parse localStorage to hash
        var tmp = JSON.parse(localStorage.triggeredEvents);
        if (tmp[event]) {
            tmp[event].push(result);
        }
        else {
            tmp[event] = [result];
        }
        localStorage.triggeredEvents = JSON.stringify(tmp);
    }, true);
};

internals.WindowEventBinder.prototype.exposeEvent = function() {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL('jsEvents.js');
    (document.head||document.documentElement).appendChild(s);
    s.onload = function() {
        s.parentNode.removeChild(s);
    };
};

var js = new internals.WindowEventBinder();

// we only care about javascript error so far
js.bindEvent('error', function(eventMessage) {
    return {
        message: eventMessage.message,
        url: eventMessage.filename,
        line: eventMessage.lineno
    };
});

// expose JsEvent to the page
js.exposeEvent();