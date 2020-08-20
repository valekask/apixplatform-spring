define([
	"components/hover",
    "utils"
],
function(Hover, Utils) {

    var ScatterPlotView = function(opts) {

        var options = Utils.extend({}, ScatterPlotView.defaultOptions, opts), 
        model = options.model, dimensions, 
        x = options.scales.x, 
        y = options.scales.y,
        tickFormat = d3.format(".2s"),
        xAxis = d3.svg.axis()
        	.scale(x)
        	.orient("bottom")
        	.ticks(5)
        	.tickFormat(tickFormat),
    	yAxis = d3.svg.axis()
    		.scale(y)
    		.orient("left")
    		.ticks(10)
    		.tickFormat(tickFormat),
    	hover = Hover({cssClass: options.hoverClass}),
        skipTransition = true,
        zoom = d3.behavior.zoom()
        	.on("zoom", options.onZoom);
        
        function updateDimensions(container) {
        	var dimensions = Utils.getDimensions(container);
        	dimensions.top = options.paddings.top
        	dimensions.bottom = dimensions.height - options.paddings.bottom,
        	dimensions.left = options.paddings.left,
        	dimensions.right = dimensions.width - options.paddings.right;
        	x.range([dimensions.left, dimensions.right]);
			y.range([dimensions.bottom, dimensions.top]);
			xAxis.tickSize(dimensions.top - dimensions.bottom);
			yAxis.tickSize(dimensions.left - dimensions.right);
        	return dimensions;
        }
        
        render.skipTransition = function() {
        	skipTransition = true;
        	hover.skipTransition();
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

		function getDomainOffset(domain, range, rangeOffset) {
			return (domain[0] - domain[1]) * rangeOffset / (range[0] - range[1]); 
		}
		
        function render(selection) {
            var container = selection.selectAll("#"+options.id).data([0]);
            container.enter()
            	.append("div")
            	.attr("id", options.id);
            
            var svg = container.selectAll("svg").data([0]);
			svg.enter().append("svg")
                .each(function(d) {
    				var self = d3.select(this);
    				
    				self.append("defs")
    	              .append("clipPath")
    	              .attr("id", "scatter-clip")
    	              .append("rect")
    	              .attr("transform", d3.svg.transform().translate(options.paddings.left, options.paddings.top));

    				self.append("g").attr("class", "x axis");
    		        self.append("g").attr("class", "y axis");
    				self.append("line").attr("class", "x axis-line").attr("clip-path", "url(#scatter-clip)");
    		        self.append("line").attr("class", "y axis-line").attr("clip-path", "url(#scatter-clip)");
    		        
    				self.call(zoom);
    			});
			
			var gxAxis = svg.select(".x.axis");
			var gyAxis = svg.select(".y.axis");
			var xAxisLine = svg.select(".x.axis-line");
			var yAxisLine = svg.select(".y.axis-line");
			
			if (!dimensions) {
				dimensions = updateDimensions(container);
				svg.attr("width", dimensions.width)
          			.attr("height", dimensions.height);
				
				gxAxis.attr("transform", d3.svg.transform().translate(0, dimensions.bottom));
				gyAxis.attr("transform", d3.svg.transform().translate(dimensions.left, 0));
				xAxisLine
					.attr("x1", dimensions.left)
					.attr("x2", dimensions.right);
				yAxisLine
					.attr("y1", dimensions.top)
					.attr("y2", dimensions.bottom);
				
				svg.select("#scatter-clip rect")
					.attr("width", dimensions.right - dimensions.left)
					.attr("height", dimensions.bottom - dimensions.top);
			}
			
			if (model.domains) {
				var dx = getDomainOffset(model.domains.x, x.range(), options.rangeOffsets.x),
				dy = getDomainOffset(model.domains.y, y.range(), options.rangeOffsets.y);
				var dx = (model.domains.x[1] - model.domains.x[0]) * options.rangeOffsets.x / 
				x.domain([model.domains.x[0] - dx, model.domains.x[1] + dx]);
				y.domain([model.domains.y[0] + dy, model.domains.y[1] - dy]);
				zoom.x(x).y(y);
				model.domains = undefined;
			}

			getTransition(gxAxis).call(xAxis);
			getTransition(gyAxis).call(yAxis);
			var x0 = x(0), y0 = y(0);
			getTransition(xAxisLine)
				.attr("y1", y0)
				.attr("y2", y0);
			getTransition(yAxisLine)
				.attr("x1", x0)
				.attr("x2", x0);

			var nodes = svg.selectAll("circle").data(model.nodes, function (d) {return d.id;});
			nodes.enter()
				.append("circle")
				.attr("r", options.circleRadius)
				.attr("clip-path", "url(#scatter-clip)")
				.on("click", function(d, i) {
					options.onNodeClick(d, i);
				}).on("mouseover", function(d, i) {
					options.onNodeHover(d, i);
				}).on("mouseout", function() {
					options.onNodeHover();
				});
      
			getTransition(nodes)
                	.attr("cx", function(d) {return x(d.x);})
                	.attr("cy", function(d) {return y(d.y);})
                	.attr("class", function(d) {return d.cssClass + (d.id == model.selectedNode.id ? " node-selected" : '');});

			if (model.selectedNode) {
				hover.show(x(model.selectedNode.x), y(model.selectedNode.y)-options.circleRadius, model.selectedNode.id);
			} else {
				hover.hide();
			}
			svg.call(hover);
			
			skipTransition = false;
        }

        return render;
    }

    ScatterPlotView.defaultOptions = {
    	id: "scatterplot",
    	hoverClass: "scatter",
    	transitionTime : 1000,
    	circleRadius: 2,
    	paddings: {
			top: 0,
			right: 1,
			bottom: 16,
			left: 25
		},
		rangeOffsets: {
			x: 20,
			y: 20
		}
    }
    
    return ScatterPlotView;
});