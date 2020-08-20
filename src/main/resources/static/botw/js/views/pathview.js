define([
    "d3",
    "services/labelpositioner",
    "utils"
],
function(d3, LabelPositioner, Utils) {

    var PathView = function(opts) {
    	var options = Utils.extend({}, PathView.defaultOptions, opts), model,
    	labelPositioner = LabelPositioner({transitionTime: 0});
    	
    	function getNodeLabel(d) {
    		return model && model.nodesLabelsEnabled && model.nodesLabels && model.nodesLabels[d.id] ? model.nodesLabels[d.id] : null;
    	} 

    	function getLinkLabel(d) {
    		return model && model.linksLabels && model.linksLabels[d.id] ? model.linksLabels[d.id] : null; 
    	} 

        function getTransition(selection) {
        	return Utils.getTransition(selection, false, options.transitionTime);
        }
        
        function render(selection) {
        	
			var nodes = selection.selectAll("g.node");
            nodes.style("opacity", function(d) {
            	return !model || model.nodes.has(d.id) ? 1 : 0.2;
            });

            var nodeLabels = nodes.selectAll("text").data(function(d) {
            	return getNodeLabel(d) || d.labelOpacity ? [d] : [];
            });
            nodeLabels.enter()
                .append("text")
                .attr("font-size", "12px")
                .style("opacity", 0);
            nodeLabels.exit()
                .transition().duration(options.transitionTime)
                .style("opacity", 0)
                .remove();
            getTransition(nodeLabels)
            	.style("opacity", 1)
            	.attr("x", function(d) {return d.labelPosition.x;})
            	.attr("y", function(d) {return d.labelPosition.y;})
            	.attr("text-anchor", function(d) {return d.labelPosition.anchor;})
            	.attr("alignment-baseline", function(d) {return d.labelPosition.baseline;})
                .text(function(d) { return model && model.nodesLabelsEnabled ? getNodeLabel(d) : d.label; });
//            labelPositioner.updateNodeLabels(transition, selection);

			var links = selection.selectAll("g.linkGroup");
			links.style("opacity", function(d) {
            	return !model || model.links.has(d.id) ? 1 : 0.2;
            });
			
            var linkLabels = links.selectAll("text.pathLabel").data(function(d) {
            	return getLinkLabel(d) || d.labelOpactity ? [d] : [];
            });
            linkLabels.enter()
                .append("text")
                .attr("class", "pathLabel")
                .attr("font-size", "12px")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle");
//                .style("opacity", 0);
            linkLabels.exit()
//                .transition().duration(options.transitionTime)
//                .style("opacity", 0)
                .remove();
            getTransition(linkLabels)
//            	.style("opacity", 1)
            	.attr("x", function(d) {return d.labelPosition.x;})
                .attr("y", function(d) {return d.labelPosition.y;})
                .text(function(d) { return getLinkLabel(d) || d.label; });
			
			return this;
        };
        function show(amodel) {
        	model = amodel;
            return render;
        };
        function hide() {
        	model = null;;
            return render;
        };
        render.show	= show;
        render.hide = hide;
        return render;
    };

    PathView.defaultOptions = {
		transitionTime: 1000
	};

    return PathView;
});