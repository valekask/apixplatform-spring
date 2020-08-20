define([
    "d3"
],
function(d3) {

    var Utils = {};

    Utils.extend = function(target) {
        var sources = Array.prototype.slice.call(arguments, 1);
        for ( var i = 0, len = sources.length; i < len; i++) {
            var source = sources[i];
            for ( var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            }
        }
        return target;
    };

    Utils.get = function(obj, key) {
    	var keys = key.split('.'), val = obj;
    	for ( var i = 0; i < keys.length; i++) {
			val = val[keys[i]];
		}
    	return val;
    };
    
    Utils.forEachProperty = function(obj, callback) {
		for ( var key in obj) {
			if (obj.hasOwnProperty(key)) {
				callback(obj[key], key);
			}
		}
	};
    
    Utils.isTransitionRequired = function(firstLoad) {
    	return !firstLoad && !(d3.event && (d3.event.type == "zoom" || d3.event.type == "mousemove"));
    }
    
    Utils.getTransition = function(selection, firstLoad, transitionTime) {
    	return selection.transition().duration(Utils.isTransitionRequired(firstLoad) ? transitionTime : 0);
    }

    Utils.Scale = function(type) {
        return (Utils.Scale[type] || Utils.Scale.ordinal)();
    };
    
    Utils.extend(Utils.Scale, {
        ordinal: d3.scale.ordinal,
        linear: d3.scale.linear,
        time: d3.time.scale
    });
    
    Utils.getDimensions = function(selection) {
		var div = $("#"+selection.attr("id"))
		return {
			width: div.width(),
			height: div.height()
		}
	}

    return Utils;
});