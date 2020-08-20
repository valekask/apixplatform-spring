define([
    "d3",
    "components/hover",
    "services/labelpositioner",
    "utils"
],
function(d3, Hover, LabelPositioner, Utils) {

	function GraphView(opts) {
		var options = Utils.extend({}, GraphView.defaultOptions, opts),
		    nodesDomain = [], linksDomain = [],
            zoomed,
    		hover = Hover({cssClass: options.cssClass}), nodeUnderHover, linkUnderHover,
    		labelPositioner = LabelPositioner({transitionTime: options.transitionTime}),
            selectedNode,
            dblClick = 0, // For click & double click  workaround.
            firstLoad = true, dragNode, isDragging = false;
		
		function render(selection) {
			var g = selection.selectAll("div."+options.cssClass).data([0]);
			g.enter().append("div").attr("class", options.cssClass);
			g = g.selectAll("svg").data([0]);
			g.enter().append("svg")
				.attr("width", options.dimensions.width)
				.attr("height", options.dimensions.height)
                .on("mousedown", svgMouseDown)
				.call(zoomed)
                .on("dblclick.zoom", null); // Disable zoom on double click.

            initMarker(g);
            
            if (linksDomain.length) {
                renderLink(g);
            }

            if (nodesDomain.length) {
                renderNode(g);
                firstLoad = false;
            }
            
            return this;
		};

		function dragDetected(svg) {
			console.log("dragDetected");
            isDragging = true;
            resetDragDetection(svg);
		}
		
		function resetDragDetection(svg) {
			svg.on("mousemove.svg"+options.cssClass, null);
            svg.on("mouseleave.svg"+options.cssClass, null);
		}
		
        function svgMouseDown() {
        	console.log("svgMouseDown");
        	var svg = d3.select(this);
            svg.on("mousemove.svg"+options.cssClass, function(e) {
            	dragDetected(svg);
            }).on("mouseleave.svg"+options.cssClass, function(e) {
            	dragDetected(svg);
            }).on("mouseup.svg"+options.cssClass, function () {
            	var wasDragging = isDragging;
            	isDragging = false;

            	console.log("svgMouseUp "+wasDragging);
            	resetDragDetection(svg);
            	svg.on("mouseup.svg"+options.cssClass, null);
            	if (!wasDragging) { //was clicking
            		options.onNodeClick();
            	}
            });
        };

        function initMarker(selection) {
            var defs = selection.selectAll("defs").data([0]).enter().append("defs");
            var markers = defs.selectAll("marker").data([0]);
            markers.enter().append("marker")
                .attr("id", function(d, i) { return "triangle-"  + i; })
                .attr("viewBox", "0 0 10 10")
                .attr("refX", "0")
                .attr("refY", "5")
                .attr("markerUnits", "strokeWidth")
                .attr("markerWidth", options.marker.width)
                .attr("markerHeight", options.marker.height)
                .attr("orient", "auto")
                .attr('opacity', '0.7')
                .append("path")
                .attr("d", "M 0 0 L 10 5 L 0 10 z")
                .attr("stroke-width", "0")  // Specify these for IE.
                .attr("fill", "black");
        }
        
        function getTransition(selection) {
        	return Utils.getTransition(selection, firstLoad, options.transitionTime);
        }
        
        /* NODES */
        
        function renderNode(selection) {
            var svgContainer = selection;

            var nodes = selection.selectAll("g.node").data(nodesDomain, function (d) {return d.id;});

            var nodesEnter = nodes.enter()
                .append("g").attr("class", "node");
            if (!firstLoad) {
                nodesEnter.style("opacity", 0)
                    .transition().duration(options.transitionTime)
                    .style("opacity", "1");
            }

            nodesEnter.append("svg:circle");

            nodes.exit()
                .transition().duration(options.transitionTime)
                .style("opacity", "0")
                .remove();

            nodes.classed("node-selected", function(d) {
                return d.src === selectedNode;
            });

            var circles = nodes.select("circle")
                .attr("class", function(d) {return d.cssClass;});
            getTransition(circles)
                .attr("cx", function(d) {return d.x;})
                .attr("cy", function(d) {return d.y;})
                .attr("r", function(d) {return d.r;})
                .style("stroke-width", function(d) {return d.strokeWidth ? d.strokeWidth + "px" : null;})
                .style("stroke", function(d) {return d.strokeColor ? d.strokeColor : null;});

            renderNodeLabel(nodes, svgContainer);
            
            if (nodeUnderHover) {
            	nodes.each( function(d) {
            		if (d.id == nodeUnderHover.id) {
            			svgContainer.call(hover.show(d.hoverPosition[0], d.hoverPosition[1], options.nodeHoverGetter(d)));
            		}
            	});
            }

            if (nodesDomain.length > 0) {
                bindNodeEvent(nodesEnter, svgContainer);
            }
        }

        function renderNodeLabel(nodes, svgContainer) {
            var labels = nodes.selectAll("text").data(function(d) {return d.labelOpacity ? [d] : [];});
            labels.enter()
                .append("text")
                .attr("font-size", "12px")
                .style("opacity", function(d) { return firstLoad? d.labelOpacity: 0; });

            labels.exit()
                .transition().duration(options.transitionTime)
                .style("opacity", "0")
                .remove();

            getTransition(labels)
            	.style("opacity", function(d) { return d.labelOpacity; })
                .attr("x", function(d) {return d.labelPosition.x;})
                .attr("y", function(d) {return d.labelPosition.y;})
                .attr("text-anchor", function(d) {return d.labelPosition.anchor;})
                .attr("alignment-baseline", function(d) {return d.labelPosition.baseline;})
                .text(function(d) { return d.label });

//            labelPositioner.updateNodeLabels(transition, svgContainer, firstLoad);
        }
        
        function bindNodeEvent(nodes, svgContainer) {
            nodes.on("mouseup", function(d, i) {
            	if (isDragging) return;
            	console.log("click "+isDragging);
                var e = d3.event;
                setTimeout(function() {
                    if (dblClick <= 0) {
                        d3.event = e;
                        options.onNodeClick(d, i);
                    }
                    dblClick--
                }, 200);
//                e.stopPropagation();
            }).on("dblclick", function(d, i) {
                dblClick = 2;
                options.onNodeDblClick(d, i);
                d3.event.stopPropagation();
            }).on("mouseover", function(d, i) {
	        	if (options.nodeHoverGetter) {
	        		nodeUnderHover = d;
	        		linkUnderHover = null;
	        		svgContainer.call(hover.show(d.hoverPosition[0], d.hoverPosition[1], options.nodeHoverGetter(d)))
	        	}
	        }).on("mouseout", function(d, i) {
	        	if (options.nodeHoverGetter) {
	        		nodeUnderHover = null;
	        		svgContainer.call(hover.hide());
	        	}
	        }).on("mousedown", dragStart);
        }
        
		function dragStart(d) {
			console.log("dragStart");
			d3.select(this.parentElement)
				.on("mousemove."+options.cssClass, drag)
				.on("mouseup."+options.cssClass, dragEnd)
				.on("mouseleave."+options.cssClass, dragEnd);
			dragNode = d;
			d3.event.stopPropagation();
		};

		function drag() {
			console.log("drag");
			options.onNodeDrag.call(this, dragNode);
			isDragging = true;
//			d3.event.stopPropagation();
		};

		function dragEnd() {
			console.log("dragEnd");
			d3.select(this)
				.on("mousemove."+options.cssClass, null)
				.on("mouseup."+options.cssClass, null)
				.on("mouseleave."+options.cssClass, null);
			dragNode = null;
			isDragging = false;
			d3.event.stopPropagation();
		};
		
		/* LINKS */
	
		function renderLink(selection) {

	        var linkGroup = selection.selectAll("g.linkGroup").data(linksDomain, function (d) {return d.id;});

	        var linkGroupEnter = linkGroup.enter()
	            .append("g") // Create group for link and marker.
	            .attr("class", "linkGroup");

	        if (!firstLoad) {
	            linkGroupEnter
	                .style("stroke-opacity", 0)
	                .transition().duration(options.transitionTime)
	                .style("stroke-opacity", 1);
	        }

	        linkGroupEnter.each(function() {
	            var self = d3.select(this);
	            self.append("svg:path") // Create path element for link.
	                .attr("class", "link")
	                .style("stroke", "black")
	                .style("stroke-opacity", "0.5")
	                .style("opacity", "0.5");

	            self.append("svg:path") // Create path element for marker.
	                .attr("class", "marker")
	                .attr("marker-end", "url(#triangle-0)")
	                .style("stroke", "black")
	                .style("stroke-opacity", "0")
	                .style("opacity", "0.5");

	            self.append("svg:path")
                	.attr("class", "area")
                	.style("stroke-opacity", "0");
	        });

	        var linkGroupExit = linkGroup.exit();

	        linkGroupExit.each(function() {
	            var self = d3.select(this);
	            self.transition().duration(options.transitionTime)
	            .style("opacity", "0")
	            .style("stroke-opacity", "0")
	            .remove();
	        });
	        
	        linkGroup.style("display", function(d) {return d.hidden ? "none" : null;});
	        linkGroup.select("path.marker").style("display", function(d) {return d.markerHidden ? "none" : null;});

	        getTransition(linkGroup.select("path.link"))
	        	.style("stroke", function(d) { return 'black'; })
	            .style("stroke-width", function(d) { return d.width+'px'; })
	            .attr("d", function(d) { return d.path; });

	        getTransition(linkGroup.select("path.marker"))
	        	.style("stroke-width", function(d) { return d.markerWidth+'px'; })
	            .attr("d", function(d) { return d.path; });

	        getTransition(linkGroup.select("path.area"))
	        	.style("stroke", function(d) { return 'black'; })
	        	.style("stroke-width", function(d) {return d.areaWidth+'px';})
	            .attr("d", function(d) { return d.areaPath; });

	        renderLinkLabel(linkGroup);

            bindLinkEvent(linkGroup, selection);
            
            if (linkUnderHover) {
            	linkGroup.each( function(d) {
            		if (d.id == linkUnderHover.id) {
            			selection.call(hover.show(d.hoverPosition[0], d.hoverPosition[1], options.linkHoverGetter(d)))
            		}
            	});
            }

		}

	    function renderLinkLabel(links) {
	        var labels = links.selectAll("text").data(function(d) {return d.labelOpacity ? [d] : [];});
	        labels.enter()
	            .append("text")
	            .attr("font-size", "12px")
	            .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
	            .style("opacity", function(d) { return firstLoad? d.labelOpacity: 0; });

	        labels.exit()
	            .transition().duration(options.transitionTime)
	            .style("opacity", "0")
	            .remove();

	        getTransition(labels)
	        	.style("opacity", function(d) { return d.labelOpacity; })
	          	.attr("x", function(d) {return d.labelPosition.x;})
	            .attr("y", function(d) {return d.labelPosition.y;})
            	.text(function(d) { return d.label; });
	    }

	    function bindLinkEvent(links, svgContainer) {
	        links.on("click", function(d, i) {
	            options.onLinkClick(d, i);
	        }).on("mouseover", function(d, i) {
	        	if (options.linkHoverGetter) {
	        		nodeUnderHover = null;
	        		linkUnderHover = d;
	        		svgContainer.call(hover.show(d.hoverPosition[0], d.hoverPosition[1], options.linkHoverGetter(d)))
	        	}
	        }).on("mouseout", function(d, i) {
	        	if (options.linkHoverGetter) {
	        		linkUnderHover = null;
	        		svgContainer.call(hover.hide());
	        	}
	        });
	    };
	    
		render.withData = function(adata) {
			nodesDomain = adata.nodes;
			linksDomain = adata.links;
			return render;
		};

		render.withSelectedNode = function(anode) {
			selectedNode = anode;
			return render;
		};

		render.withZoom = function(azoomed) {
			zoomed = azoomed;
			return render;
		};

		return render;
	};

	GraphView.defaultOptions = {
		cssClass: 'graph',
		transitionTime: 1000,
        onNodeClick: new Function(),
        onNodeDblClick: new Function(),
        onNodeDrag: new Function(),
        onLinkClick: new Function()
	};

    return GraphView;
});
