define([
    "utils"
],
function(Utils) {
	
	var format = d3.format(".2s");
	
	var BoxPlotView = {

		X: function(opts) {
			
			var options = Utils.extend({}, BoxPlotView.X.defaultOptions, opts), 
			model = options.model, dimensions, scale = options.scale, groupIndex = {},
			skipTransition = true;

			function updateDimensions(container) {
				var dimensions = Utils.getDimensions(container);
				return dimensions;
			}
	    
			render.skipTransition = function() {
				skipTransition = true;
				return render;
			}
	    
			function getTransition(selection) {
				return selection.transition().duration(skipTransition ? 0 : options.transitionTime);
			}
        
			render.updateSvgDimensions = function() {
				dimensions = null;
				skipTransition = true;
				return render;
			};
			
			function render(selection) {
				var container = selection.selectAll("#"+options.id).data([0]);
				container.enter()
            		.append("div")
            		.attr("id", options.id);
            
				var svg = container.selectAll("svg").data([0]);
				svg.enter().append("svg")
                	.each(function(d) {
                		var self = d3.select(this);
    				
                		var g = self.append("g")
                			.attr("class", "tick");
                		g.append("circle").attr("r", options.rTick);
                		g.append("line").attr("y1", 0);
    			});
			
				if (!dimensions) {
					dimensions = updateDimensions(container);
					svg.attr("width", dimensions.width)
          				.attr("height", dimensions.height);
					svg.select("g.tick line")
						.attr("y2", dimensions.height);
				}
			
				var groups = svg.selectAll("g.box").data(model.groups);
				groups.enter()
					.insert("g", "g.tick")
					.attr("class", "box")
					.each(function(d, i) {
						var dty = options.padding + i * options.width;
                		var g = d3.select(this).append("g")
                			.attr("transform", d3.svg.transform().translate(0, dty));

                		var center = options.width / 2,
                		top = center - options.boxWidth / 2,
                		bottom = center + options.boxWidth / 2;
                		groupIndex[d.groupId] = dty + center;

                		g.append("line").attr("class", "center " + d.cssClass)
                			.attr("y1", center)
                			.attr("y2", center);
                		g.append("rect").attr("class", "box " + d.cssClass)
                			.attr("y", top)
							.attr("height", options.boxWidth);
                		g.append("line").attr("class", "median " + d.cssClass)
                			.attr("y1", top)
                			.attr("y2", bottom);
                		g.append("line").attr("class", "whisker-min " + d.cssClass)
                			.attr("y1", top)
                			.attr("y2", bottom);
                		g.append("line").attr("class", "whisker-max " + d.cssClass)
                			.attr("y1", top)
                			.attr("y2", bottom);
                		
                		g = g.append("g").attr("class", "text").style("display", "none");
                		
                		g.append("text").attr("class", "q1")
                			.attr("y", bottom)
                			.attr("dy", options.dyBottom)
            				.attr("text-anchor", "middle");
                		g.append("text").attr("class", "q3")
                			.attr("y", bottom)
                			.attr("dy", options.dyBottom)
                			.attr("text-anchor", "middle");
                		g.append("text").attr("class", "q2")
        					.attr("y", top)
        					.attr("dy", options.dyTop)
        					.attr("text-anchor", "middle");
                		g.append("text").attr("class", "whisker-min")
    						.attr("y", top)
    						.attr("dy", options.dyTop)
    						.attr("text-anchor", "middle");
                		g.append("text").attr("class", "whisker-max")
    						.attr("y", top)
    						.attr("dy", options.dyTop)
    						.attr("text-anchor", "middle");
					});
				
				var cx = scale(model.selectedNode.x),
				cy = groupIndex[model.selectedNode.groupId];
				var tick = svg.select("g.tick")
//				tick.select("circle").attr("cy", cy);
				tick = getTransition(tick);
				tick.select("circle")
					.attr("cx", cx)
					.attr("cy", cy)
				tick.select("line")
					.attr("x1", cx)
					.attr("x2", cx);
				
				groups.each(function(d) {
					var g = d3.select(this);
					
					g.style("opacity", function(d) {
		            	return model.isOnHover ? (model.selectedNode.groupId == d.id ? 1 : 0.2) : null;
		            });
					g.select("g.text").style("display", model.isOnHover && model.selectedNode.groupId == d.id ? null : "none");
					
					g = getTransition(g);
	            		
					var min = scale(d.min),
					max = scale(d.max),
					q1 = scale(d.q1),
					q2 = scale(d.q2),
					q3 = scale(d.q3);
						
					g.select("line.center")
						.attr("x1", min)
						.attr("x2", max);
					g.select("rect.box")
						.attr("x", q1)
						.attr("width", q3 - q1);
					g.select("line.median")
						.attr("x1", q2)
						.attr("x2", q2);
					g.select("line.whisker-min")
						.attr("x1", min)
						.attr("x2", min);
					g.select("line.whisker-max")
						.attr("x1", max)
						.attr("x2", max);
					
					g.select("text.q1")
    					.attr("x", q1)
    					.text(format(d.q1));
					g.select("text.q3")
        				.attr("x", q3)
        				.text(format(d.q3));
					g.select("text.q2")
    					.attr("x", q2)
    					.text(format(d.q2));
					g.select("text.whisker-min")
						.attr("x", min)
						.text(format(d.min));
					g.select("text.whisker-max")
						.attr("x", max)
						.text(format(d.max));
				});
				
				skipTransition = false;
			}

			return render;
		},
		Y: function(opts) {

			var options = Utils.extend({}, BoxPlotView.Y.defaultOptions, opts), 
			model = options.model, dimensions, scale = options.scale, groupIndex = {},
			skipTransition = true;

			function updateDimensions(container) {
				var dimensions = Utils.getDimensions(container);
				return dimensions;
			}
	    
			render.skipTransition = function() {
				skipTransition = true;
				return render;
			}
	    
			function getTransition(selection) {
				return selection.transition().duration(skipTransition ? 0 : options.transitionTime);
			}
        
			render.updateSvgDimensions = function() {
				dimensions = null;
				skipTransition = true;
				return render;
			};
			
			function render(selection) {
				var container = selection.selectAll("#"+options.id).data([0]);
				container.enter()
            		.append("div")
            		.attr("id", options.id);
            
				var svg = container.selectAll("svg").data([0]);
				svg.enter().append("svg")
                	.each(function(d) {
                		var self = d3.select(this);
    				
                		var g = self.append("g")
                			.attr("class", "tick");
                		g.append("circle").attr("r", options.rTick);
                		g.append("line").attr("x1", 0);
    			});
			
				if (!dimensions) {
					dimensions = updateDimensions(container);
					svg.attr("width", dimensions.width)
          				.attr("height", dimensions.height);
					svg.select("g.tick line")
						.attr("x2", dimensions.width);
				}
			
				var groups = svg.selectAll("g.box").data(model.groups);
				groups.enter()
					.insert("g", "g.tick")
					.attr("class", "box")
					.each(function(d, i) {
						var dtx = options.padding + i * options.width;
                		var g = d3.select(this).append("g")
                			.attr("transform", d3.svg.transform().translate(dtx, 0));

                		var center = options.width / 2,
                		left = center - options.boxWidth / 2,
                		right = center + options.boxWidth / 2,
                		leftAligned = i > (model.groups.length - 1) / 2,
                		tx = leftAligned ? left : right,
                		dx = leftAligned ? -options.dx : options.dx,
                		tanchor = leftAligned ? "end" : null;
                		groupIndex[d.groupId] = dtx + center;

                		g.append("line").attr("class", "center " + d.cssClass)
                			.attr("x1", center)
                			.attr("x2", center);
                		g.append("rect").attr("class", "box " + d.cssClass)
                			.attr("x", left)
							.attr("width", options.boxWidth);
                		g.append("line").attr("class", "median " + d.cssClass)
                			.attr("x1", left)
                			.attr("x2", right);
                		g.append("line").attr("class", "whisker-min " + d.cssClass)
                			.attr("x1", left)
                			.attr("x2", right);
                		g.append("line").attr("class", "whisker-max " + d.cssClass)
                			.attr("x1", left)
                			.attr("x2", right);
                		
                		g = g.append("g").attr("class", "text").style("display", "none")
                			.attr("transform", d3.svg.transform().translate(dx, 0));
                		
                		g.append("text").attr("class", "q1")
                			.attr("x", tx)
                			.attr("dy", options.dy)
            				.attr("text-anchor", tanchor);
                		g.append("text").attr("class", "q3")
                			.attr("x", tx)
                			.attr("dy", options.dy)
            				.attr("text-anchor", tanchor);
                		g.append("text").attr("class", "q2")
                			.attr("x", tx)
                			.attr("dy", options.dy)
            				.attr("text-anchor", tanchor);
                		g.append("text").attr("class", "whisker-min")
                			.attr("x", tx)
                			.attr("dy", options.dy)
            				.attr("text-anchor", tanchor);
                		g.append("text").attr("class", "whisker-max")
                			.attr("x", tx)
                			.attr("dy", options.dy)
            				.attr("text-anchor", tanchor);
					});
				
				var cx = groupIndex[model.selectedNode.groupId],
				cy = scale(model.selectedNode.y);
				var tick = svg.select("g.tick")
//				tick.select("circle").attr("cx", cx);
				tick = getTransition(tick);
				tick.select("circle")
					.attr("cx", cx)
					.attr("cy", cy)
				tick.select("line")
					.attr("y1", cy)
					.attr("y2", cy);
				
				groups.each(function(d) {
					var g = d3.select(this);
					
					g.style("opacity", function(d) {
		            	return model.isOnHover ? (model.selectedNode.groupId == d.id ? 1 : 0.2) : null;
		            });
					g.select("g.text").style("display", model.isOnHover && model.selectedNode.groupId == d.id ? null : "none");
					
					g = getTransition(g);
	            	
					var min = scale(d.min),
					max = scale(d.max),
					q1 = scale(d.q1),
					q2 = scale(d.q2),
					q3 = scale(d.q3);
					
					g.select("line.center")
						.attr("y1", min)
						.attr("y2", max);
					g.select("rect.box")
						.attr("y", q3)
						.attr("height", q1 - q3);
					g.select("line.median")
						.attr("y1", q2)
						.attr("y2", q2);
					g.select("line.whisker-min")
						.attr("y1", min)
						.attr("y2", min);
					g.select("line.whisker-max")
						.attr("y1", max)
						.attr("y2", max);
					
					g.select("text.q1")
    					.attr("y", q1)
    					.text(format(d.q1));
					g.select("text.q3")
        				.attr("y", q3)
        				.text(format(d.q3));
					g.select("text.q2")
    					.attr("y", q2)
    					.text(format(d.q2));
					g.select("text.whisker-min")
						.attr("y", min)
						.text(format(d.min));
					g.select("text.whisker-max")
						.attr("y", max)
						.text(format(d.max));
				});
				
				skipTransition = false;
			}
			
			return render;
		}
    }
	
	BoxPlotView.defaultOptions = {
	    transitionTime : 1000,
	    padding: 8,
	    width: 9,
	    boxWidth: 3,
	    rTick: 2
	}
		
    BoxPlotView.X.defaultOptions = Utils.extend({}, BoxPlotView.defaultOptions, {
    	id: 'boxplot-x',
    	dyTop: "-.5em",
    	dyBottom: "1.2em"
    });

    BoxPlotView.Y.defaultOptions = Utils.extend({}, BoxPlotView.defaultOptions, {
    	id: 'boxplot-y',
    	dx: 5,
    	dy: ".2em"
    });

    return BoxPlotView;
});