define([
    "d3",
    "dispatcher",
    "services/graphmapper",
    "views/graphview",
    "views/pathview",
    "utils"
],
function(d3, Dispatcher, GraphMapper, GraphView, PathView, Utils) {

	function MacroStateController(opts) {
		var options = Utils.extend({}, MacroStateController.defaultOptions, opts),
		networks, data, dataModel, pathData, pathModel, mode = Dispatcher.MODE.DEFAULT,
		container = d3.select(options.container), 
		view = new GraphView({
			cssClass: options.cssClass, 
//			transitionTime: options.transitionTime,
			dimensions: options.dimensions,
			marker: options.marker,
			onNodeDrag: onNodeDrag,
            nodeHoverGetter: function(d) {return d.groupDistance;},
			linkHoverGetter: function(d) {
				var transitionsCount = transitionsCountMap[d.src.from.vertex_id],
				transitionsProbability = d.src.transition_count/transitionsCount;
				return format(transitionsProbability) + " " + d.lastTransition;	
//				return d.lastTransition;
			}
		}),
		transitionsCountMap,
		path = new PathView({}),
		mapper = new GraphMapper({
			dimensions: options.dimensions,
			marker: options.marker
		}),
		format = d3.format("%"),
		frameIndex = options.initialFrame, selfLinksEnabled,
		zoomed = d3.behavior.zoom()
			.x(mapper.xScale())
			.y(mapper.yScale())
			.on("zoom", function(d){
				updateModel();
				render(view.withData(dataModel));
			});
		view.withZoom(zoomed);
		
		function getSelectedNode() {
			var id = networks[frameIndex].state.group.id;
			for ( var i = 0; i < data.nodes.length; i++) {
				if (data.nodes[i].vertex_id == id) {
					return data.nodes[i];
				}
			}
		}
		
		function updateModel() {
			dataModel = mapper.mapData(data);
			var distances = networks[frameIndex].state.distances;
			for ( var i = 0; i < dataModel.nodes.length; i++) {
				var node = dataModel.nodes[i];
				node.label = format(node.src.pagerank);
				var distance = distances && distances[node.id] &&  distances[node.id].value
						? distances[node.id].value.toFixed(0) 
						: '-';
				node.groupDistance = "Distance: " + distance;
			}
			var links = [];
			for ( var i = 0; i < dataModel.links.length; i++) {
				var link = dataModel.links[i];
				if (!selfLinksEnabled && link.src.from === link.src.to) continue;
				var transitionsCount = transitionsCountMap[link.src.from.vertex_id],
//				tscale = d3.scale.log().domain([1, 101]).range(options.mappings.link.width.range),
				tscale = d3.scale.linear().domain([0, 1]).range([1.0,5.0]),
				transitionsProbability = link.src.transition_count/transitionsCount;
				link.width = tscale(transitionsProbability);
//				link.labelOpacity = 1;
				links.push(link);
			}
			dataModel.links = links;
			mapper.resolveLinksPaths(dataModel);
		}

		function updateScales() {
			mapper.updateScales(data);
			transitionsCountMap = {};
			for ( var i = 0; i < data.nodes.length; i++) {
				var node = data.nodes[i], transitionsCount = 0;
				for (var linkId in node.fromLinks) {
					if (!node.fromLinks.hasOwnProperty(linkId) ||
						!selfLinksEnabled && node.fromLinks[linkId].to === node) continue;
					transitionsCount += node.fromLinks[linkId].transition_count;
				}
				transitionsCountMap[node.vertex_id] = transitionsCount; 
			}
		}
		
		function updatePathModel() {
			switch (mode) {
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
		
		function updateSpModel() {
			var node = networks[frameIndex].state.fromSpVpLinks[pathData];
			if (!node) { //not loaded yet
				pathModel = null;
				return;
			}
			var path = node.shortestpath;
	    	pathModel = { 
	    		nodes: d3.set(),
	            links: d3.set(),
//	            nodesLabels: {},
//              nodesLabelsEnabled: true
	        };
	    	if (!path) {
	    		return;
	    	}
	    	var nodesMap = data.nodesMap;
        	for (var i = 0; i < path.length; i++) {
        		var groupId = path[i].group.id,
           		node = nodesMap[groupId];
           		pathModel.nodes.add(groupId);
//           		pathModel.nodesLabels[groupId] = groupId; 
           		if (i < path.length - 1) {
           			var link = path[i].fromLinks[path[i + 1].vertex_id],
           			from = nodesMap[link.from.group.id],
           			to = nodesMap[link.to.group.id];
           			var macroLink = from.fromLinks[to.vertex_id];
           			pathModel.links.add(macroLink.arc_id);
           		}
			}
		}
		
        function updateHpModel() {
        	var end = pathData;
			pathModel = { 
		    	nodes: d3.set(),
		    	links: d3.set(),
	            linksLabels: {},
//	            nodesLabels: {},
//              nodesLabelsEnabled: true
		    };
			if (end) {
				var prev, nodesMap = data.nodesMap;
				for ( var i = frameIndex; i <= end; i++) {
					var state = networks[i].state;
	        		if (prev) {
	        			var link = state.toLinks[prev.vertex_id];
	           			from = nodesMap[link.from.group.id],
	           			to = nodesMap[link.to.group.id];
	           			if (link.from !== link.to) {
	           				var macroLink = from.fromLinks[to.vertex_id];
	           				pathModel.links.add(macroLink.arc_id);
	           			}
	        		}
					if (state !== prev) {
						var groupId = state.group.id,
		           		node = nodesMap[groupId];
		           		pathModel.nodes.add(groupId);
//                        pathModel.nodesLabels[groupId] = groupId;
						prev = state;
					}
				}
			}
		}

		function updateReachableModel() {
			var reachableData = pathData;
            var fromSpVpLinks = networks[frameIndex].state.fromSpVpLinks,
            nodesMap = data.nodesMap;
            pathModel = {
                nodes: d3.set(),
                links: d3.set(),
                nodesLabels: {},
                nodesLabelsEnabled: true
            };
                
            var prob = reachableData.prob / 100;
            var stepIndex = "vp" + reachableData.step;

            for (var k in fromSpVpLinks) {
              	var p = fromSpVpLinks[k][stepIndex];
                if (p >= prob) {
                   	var path = fromSpVpLinks[k].shortestpath;
                   	for (var i = 0; i < path.length; i++) {
                   		var groupId = path[i].group.id,
                   		node = nodesMap[groupId];
                   		pathModel.nodes.add(groupId);
                   		var pmax = pathModel.nodesLabels[groupId];
                   		pathModel.nodesLabels[groupId] = !pmax || pmax < p ? p : pmax; 
                   		if (i < path.length - 1) {
                   			var link = path[i].fromLinks[path[i + 1].vertex_id],
                   			from = nodesMap[link.from.group.id];
                   			to = nodesMap[link.to.group.id];
                   			var macroLink = from.fromLinks[to.vertex_id];
                   			pathModel.links.add(macroLink.arc_id);
                   		}
            		}
                }
            }
            for ( var groupId in pathModel.nodesLabels) {
            	if (!pathModel.nodesLabels.hasOwnProperty(groupId)) continue;
				pathModel.nodesLabels[groupId] = format(pathModel.nodesLabels[groupId]);
            }
        }
        
        function onNodeDrag(d, i) {
        	var pos = d3.mouse(this);
        	d.src.x = mapper.xScale().invert(pos[0]);
        	d.src.y = mapper.yScale().invert(pos[1]);
        	updateModel();
        	render(view.withData(dataModel));
        }
        
        Dispatcher.on("changeMode."+options.cssClass, function(amode, p) {
			mode = amode;
			pathData = p;
			updatePathModel();
            render(view);
		});
        
		Dispatcher.on("data."+options.cssClass, function(adata) {
			data = adata.macroState;
			networks = adata.microState.networks;
			updateScales();
			updateModel();
			mode = Dispatcher.MODE.DEFAULT;
			updatePathModel();
			render(view.withData(dataModel).withSelectedNode(getSelectedNode()));
        });

		Dispatcher.on("update."+options.cssClass, function(framePos) {
			frameIndex = framePos;
			updateModel();
			updatePathModel();
			render(view.withData(dataModel).withSelectedNode(getSelectedNode()));
        });
		
		// disabled		
//        Dispatcher.on("changeSelfLinksEnabled."+options.cssClass, function(aselfLinksEnabled) {
//            selfLinksEnabled = aselfLinksEnabled;
//			updateScales();
//			updateModel();
//			render(view.withData(dataModel).withSelectedNode(getSelectedNode()));
//        });
 
		function render(view) {
			container.call(view);
            container.call(pathModel ? path.show(pathModel) : path.hide());
		}

		render(view);
	};
	
	MacroStateController.defaultOptions = {
		initialFrame: 0,
    	cssClass: 'macrostate',
    	marker: {
            width: 4,
            height: 3
        }
	};

    return MacroStateController;
});
