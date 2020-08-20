define([
    "d3",
    "utils"
],
function(d3, Utils) {

    var ScatterPathView = function(opts) {
    	var options = Utils.extend({}, ScatterPathView.defaultOptions, opts), 
    	model = options.model;
    	
        function render(selection) {
        	
			var nodes = selection.selectAll("circle");
            nodes.style("opacity", function(d) {
            	return !model.nodes || model.nodes.has(d.id) ? 1 : 0;
            });

			return this;
        };
        
        return render;
    };

    ScatterPathView.defaultOptions = {
	};

    return ScatterPathView;
});