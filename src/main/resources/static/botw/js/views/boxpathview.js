define([
    "d3",
    "utils"
],
function(d3, Utils) {

    var BoxPathView = function(opts) {
    	var options = Utils.extend({}, BoxPathView.defaultOptions, opts), 
    	model = options.model;
    	
        function render(selection) {
        	
			var groups = selection.selectAll("g.box");
            groups.style("opacity", function(d) {
            	return !model.groups || model.groups.has(d.id) ? 1 : 0.2;
            });

			return this;
        };
        
        return render;
    };

    BoxPathView.defaultOptions = {
	};

    return BoxPathView;
});