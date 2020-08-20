define([
    "d3"
],
function(d3) {

    var Dispatcher = {};

    var types = ["data", "update", "start", "pause", "selectNode", "selectNetworks", "up",
        "down", "showDialog", "changeGroup", "changeSelfLinksEnabled", "changeNodesLabelsEnabled", 
        "centerNode", "selectLink", "resetScale", "changeMode"];

    var dispatch = d3.dispatch.apply(this, types);

    Dispatcher.on = function(event, callback) {
        dispatch.on(event, callback);
    };

    Dispatcher.trigger = function() {
        var args = Array.prototype.slice.call(arguments);
        var event = args.shift();
        dispatch[event].apply(this, args);
    };
    
    Dispatcher.MODE = {
    	DEFAULT: 0,
    	TAIL: 1,
    	SHORTEST_PATH: 2,
    	HISTOTICAL_PATH: 3,
    	REACHABLE: 4
    };

    return Dispatcher;
});