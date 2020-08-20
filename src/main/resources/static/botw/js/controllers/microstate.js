define([
    "d3",
    "dispatcher",
    "services/graphmapper",
    "views/graphview",
    "views/pathview",
    "utils"
],
function(d3, Dispatcher, GraphMapper, GraphView, PathView, Utils) {

	function MicroStateController(opts) {
		var options = Utils.extend({}, MicroStateController.defaultOptions, opts),
		data, dataModel, pathData, pathModel, mode = Dispatcher.MODE.DEFAULT,
		container = d3.select(options.container), 
		view = new GraphView({
			cssClass: options.cssClass, 
//			transitionTime: options.transitionTime,
			dimensions: options.dimensions,
			marker: options.marker,
			onNodeClick: onNodeClick,
            onNodeDblClick: onNodeDblClick,
            onNodeDrag: onNodeDrag,
            onLinkClick: onLinkClick,
            nodeHoverGetter: function(d) {return d.id;},
			linkHoverGetter: function(d) {return d.lastTransition;}
		}),
		path = new PathView({}), 
		mapper = new GraphMapper({
			dimensions: options.dimensions,
			marker: options.marker
		}),
		linksWidthscale = d3.scale.linear().range([1.0,11.0]),
		frameIndex = options.initialFrame,
        selfLinksEnabled, nodesLabelsEnabled = true,
		zoomed = d3.behavior.zoom()
			.x(mapper.xScale())
			.y(mapper.yScale())
			.on("zoom", function(d){
				updateModel();
				render(view.withData(dataModel));
			});
		view.withZoom(zoomed);
		
		function onNodeClick(d, i) {
            if (d) {
				if (d3.event.shiftKey) {
					selectEndNode(d);
				} else {
					traverseFocusedNode(d);
				}
			} else {
				resetEndNode();
			}
		}

        function onNodeDrag(d, i) {
        	var pos = d3.mouse(this);
        	d.src.x = mapper.xScale().invert(pos[0]);
        	d.src.y = mapper.yScale().invert(pos[1]);
        	updateModel();
        	render(view.withData(dataModel));
        }
		
        function onLinkClick(d) {
            Dispatcher.trigger("selectLink", d.src);
            d3.event.stopPropagation();
        }
        
		function traverseFocusedNode(d) {
			var quarters = d.src.visit_list_last,
			current = data.networks[frameIndex],
			nextIndex = quarters[quarters.length - 1].index;
			if (current.state === d.src) {
				for ( var i = quarters.length-1; i >= 0; i--) {
					if (quarters[i].index < current.index) {
						nextIndex = quarters[i].index;
						break;
					}
				}
			}
			Dispatcher.trigger("update", nextIndex);
		}
		
		function selectEndNode(d) {
			if (data.networks[frameIndex].state === d.src) return; //self
        	Dispatcher.trigger("changeMode", Dispatcher.MODE.SHORTEST_PATH, d.src.vertex_id);
		}
		
		function resetEndNode() {
			Dispatcher.trigger("changeMode", Dispatcher.MODE.DEFAULT);
		}
		
        function onNodeDblClick(d, i) {
            Dispatcher.trigger("showDialog", d.src);
        }
        
		function updateModel() {
			dataModel = mapper.mapData(data);
			var links = [];
			for (var i = 0; i < dataModel.links.length; i++) {
				var link = dataModel.links[i];
				if (!selfLinksEnabled && link.src.from === link.src.to) continue;
				link.width = linksWidthscale(link.src.transition_count);
				links.push(link);
			}
			dataModel.links = links;
			mapper.resolveLinksPaths(dataModel);
			updateModelNodesLabelsEnabled();
		}
		
		function updateModelNodesLabelsEnabled() {
			for (var i = 0; i < dataModel.nodes.length; i++) {
				var node = dataModel.nodes[i];
				node.labelOpacity = nodesLabelsEnabled ? 1 : 0;
			}
		}
		
		function updateScales() {
			mapper.updateScales(data)
			var links = [];
			for ( var i = 0; i < data.links.length; i++) {
				var link = data.links[i];
				if (!selfLinksEnabled && link.from === link.to) continue;
				links.push(+link.transition_count);
			}
			linksWidthscale.domain(d3.extent(links));
		}

		function updatePathModel() {
			switch (mode) {
			case Dispatcher.MODE.TAIL:
				updateTailModel();
			    break;
			case Dispatcher.MODE.SHORTEST_PATH:
				updateSpModel();
			    break;
			case Dispatcher.MODE.HISTORICAL_PATH:
				updateHpModel();
			    break;
			case Dispatcher.MODE.REACHABLE:
				updateReachableModel();
			    break;
			default:
				pathModel = null;
			    break;
			}
		}
		
		function updateTailModel() {
			var tailSteps = pathData;
			if (!tailSteps) {
				pathModel = null;
				return;
			}
	        pathModel = { 
			    nodes: d3.set(),
			    links: d3.set(),
		        linksLabels: {},
		        nodesLabels: {},
	            nodesLabelsEnabled: nodesLabelsEnabled
			};
				
	        var c = 0, cl = -1, next;
	        for ( var i = frameIndex; c < tailSteps + 1 && i >= 0; i--) {
				var state = data.networks[i].state;
				if (c == 0 || state.vertex_id != next.id) {
			  		if (next) {
			   			var link = state.fromLinks[next.vertex_id];
			   			var label = pathModel.linksLabels[link.arc_id];
			   			pathModel.links.add(link.arc_id);
			   			if (link.from !== link.to) {
			   				pathModel.linksLabels[link.arc_id] = label ? label + ", " + cl : cl;
			   				cl--;
			   			}
			   		}
			  		if (state !== next) {
						if (!pathModel.nodes.has(state.vertex_id)) {
							pathModel.nodes.add(state.vertex_id);
	                        pathModel.nodesLabels[state.vertex_id] = state.vertex_id;
							c++;
						}
						next = state;
					}
				}
			}
	    }

		function updateSpModel() {
			var node = data.networks[frameIndex].state.fromSpVpLinks[pathData];
			if (!node) { //not loaded yet
				pathModel = null;
				return;
			}
			var path = node.shortestpath;
	    	pathModel = { 
	    		nodes: d3.set(),
	            links: d3.set(),
	            linksLabels: {},
	            nodesLabels: {},
                nodesLabelsEnabled: nodesLabelsEnabled
	        };
	    	if (!path) {
	    		// TODO maybe reset mode to default here
	    		return;
	    	}
        	for (var i = 0; i < path.length; i++) {
        		pathModel.nodes.add(path[i].vertex_id);
                pathModel.nodesLabels[path[i].vertex_id] = path[i].vertex_id;
        		if (i < path.length - 1) {
        			var link = path[i].fromLinks[path[i + 1].vertex_id];
        			pathModel.links.add(link.arc_id);
        			pathModel.linksLabels[link.arc_id] = i + 1;
        		}
			}
		}
		
        function updateHpModel() {
        	var end = pathData;
			pathModel = { 
		    	nodes: d3.set(),
		    	links: d3.set(),
	            linksLabels: {},
	            nodesLabels: {},
                nodesLabelsEnabled: nodesLabelsEnabled
		    };
			if (end) {
				var prev, cl = 1;
				for ( var i = frameIndex; i <= end; i++) {
					var state = data.networks[i].state;
	        		if (prev) {
	        			var link = state.toLinks[prev.vertex_id];
	        			pathModel.links.add(link.arc_id);
	        			if (link.from !== link.to) {
		        			var label = pathModel.linksLabels[link.arc_id];
		        			pathModel.linksLabels[link.arc_id] = label ? label + ", " + cl : cl;
		        			cl++;
	        			}
	        		}
					if (state !== prev) {
						pathModel.nodes.add(state.vertex_id);
                        pathModel.nodesLabels[state.vertex_id] = state.vertex_id;
						prev = state;
					}
				}
			}
		}
        
        function updateReachableModel() {
        	var reachableData = pathData;
            var fromSpVpLinks = data.networks[frameIndex].state.fromSpVpLinks;
            pathModel = {
                nodes: d3.set(),
                links: d3.set(),
    	        nodesLabels: {},
                nodesLabelsEnabled: nodesLabelsEnabled
            };

            var prob = reachableData.prob / 100;
            var stepIndex = "vp" + reachableData.step;

            for (var k in fromSpVpLinks) {
                if (fromSpVpLinks[k][stepIndex] >= prob) {
                  	var path = fromSpVpLinks[k].shortestpath;
                   	for (var i = 0; i < path.length; i++) {
                   		pathModel.nodes.add(path[i].vertex_id);
                        pathModel.nodesLabels[path[i].vertex_id] = path[i].vertex_id;
                   		if (i < path.length - 1) {
                   			pathModel.links.add(path[i].fromLinks[path[i + 1].vertex_id].arc_id);
                   		}
            		}
                }
            }
        }

        Dispatcher.on("update."+options.cssClass, function(framePos) {
			frameIndex = framePos;
			updatePathModel();
			render(view.withSelectedNode(data.networks[frameIndex].state));
        });

		Dispatcher.on("changeMode."+options.cssClass, function(amode, p) {
			mode = amode;
			pathData = p;
			updatePathModel();
            render(view);
		});
		
		Dispatcher.on("data."+options.cssClass, function(adata) {
			data = adata.microState;
			updateScales();
			updateModel();
			mode = Dispatcher.MODE.DEFAULT;
			updatePathModel();
			render(view.withData(dataModel).withSelectedNode(data.networks[frameIndex].state));
        });

        Dispatcher.on("changeSelfLinksEnabled."+options.cssClass, function(aselfLinksEnabled) {
            selfLinksEnabled = aselfLinksEnabled;
            mapper.updateRProperty(selfLinksEnabled ? "pagerank_loops" : "pagerank");
			updateScales();
			updateModel();
			render(view.withData(dataModel));
        });

        Dispatcher.on("changeNodesLabelsEnabled."+options.cssClass, function(anodesLabelsEnabled) {
            nodesLabelsEnabled = anodesLabelsEnabled;
            if (pathModel) {
                pathModel.nodesLabelsEnabled = anodesLabelsEnabled;
            }
            updateModelNodesLabelsEnabled();
            render(view.withData(dataModel));
        });
        
        Dispatcher.on("centerNode."+options.cssClass, function() {
        	var node = dataModel.nodesMap[data.networks[frameIndex].state.vertex_id],
        	current = zoomed.translate();
            zoomed.translate([options.dimensions.width / 2 + current[0] - node.x, 
                              options.dimensions.height / 2 + current[1] - node.y]);
            updateModel();
			render(view.withData(dataModel));
        });

		function render(view) {
			container.call(view);
            container.call(pathModel ? path.show(pathModel) : path.hide());
		}

		render(view);
	};
	
	MicroStateController.defaultOptions = {
		initialFrame: 0,
    	cssClass: 'microstate',
        marker: {
            width: 4,
            height: 3
        }
	};

    return MicroStateController;
});