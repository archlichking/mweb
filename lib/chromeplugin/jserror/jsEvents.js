var JsEvents = {};

JsEvents.getTriggeredEvent = function(name) {
    if (localStorage.triggeredEvents && localStorage.triggeredEvents != '{}') {
        if (name) {
            var tmp = JSON.parse(localStorage.triggeredEvents);
            return JSON.stringify(tmp[name]);
        }
        else {
            return localStorage.triggeredEvents;
        }
    }
};