define([
    "d3",
    "dispatcher",
    "views/nodepanelview",
    "views/linkpanelview",
    "utils"
],
function(d3, Dispatcher, NodePanelView, LinkPanelView, Utils) {

    var Panel = function(opts) {

    	var options = Utils.extend({}, Panel.defaultOptions, opts), 
    	data, link, frameIndex = options.initialFrame, 
    	selfLinksEnabled,
    	container = d3.select(options.container),
    	stateMapper = options.stateMapper,
    	format = d3.format(".1%"),
        nodePanel, linkPanel,
		nodePanelView = new NodePanelView(),
		linkPanelView = new LinkPanelView();
    	
    	var pathLabel, pathData, pathModel = [], mode = Dispatcher.MODE.DEFAULT;

    	function resetPathModel() {
    		pathLabel = null;
			pathModel = [];
    	}
    	
    	function updatePathModel() {
    		resetPathModel();
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
			default:
			    break;
			}
		}
    	
    	function updateHPathModel(hpath, reversed) {
    		// with grouping
			var start = 0, c = 0;
    		for ( var i = 1; i < hpath.length + 1; i++) {
    			if (i == hpath.length || hpath[i].state !== hpath[i - 1].state) {
					var label;
					if (start == i - 1) {
						label = hpath[start].net_id;
					} else {
						label = reversed ? 
    							hpath[i - 1].net_id + "-" + hpath[start].net_id :
    							hpath[start].net_id + "-" + hpath[i - 1].net_id;
					}
					start = i;
					var indexes = [];
					if (i != hpath.length) {
    					var from = hpath[i-1].state.vertex_id, to = hpath[i].state.vertex_id;
    					if (reversed) {
    						var t = from;
    						from = to;
    						to = t;
    					}
						indexes = stateMapper.parseLink(from, to);
					} else {
						// disable end node
						break;
					}
   					pathModel.push({
//						label: from + '-' + to,
   						label: label,
   						indexes: indexes,
   						index: reversed ? --c : ++c
    				});
    			}
    		}
    	}
    	
    	function updateTailModel() {
			var tailSteps = pathData;
			if (!tailSteps) {
				resetPathModel();
				return;
			}
        	pathLabel = "Tail";
            var c = 0, tail = [], tailMap = {};
            for ( var i = frameIndex; c < tailSteps + 1 && i >= 0; i--) {
    			var stateId = data.networks[i].state.vertex_id;
 				if (!tailMap[stateId]) {
 					tailMap[stateId] = stateId;
   					c++;
   				}
				tail.push(data.networks[i]);
    		}
            updateHPathModel(tail, true);
	    }

		function updateSpModel() {
			var node = data.networks[frameIndex].state.fromSpVpLinks[pathData];
			if (!node) { //not loaded yet
				pathModel = null;
				return;
			}
			var path = node.shortestpath;
			if (!path) {
	    		return;
	    	}
			pathLabel = "Shortest Path";
    		for ( var i = 1; i < path.length; i++) {
    			var from = path[i-1], to = path[i],
    			link = from.fromLinks[to.vertex_id];
				pathModel.push({
					label: formatProbability(link.transition_prob),
					indexes: stateMapper.parseLink(from.vertex_id, to.vertex_id)
				});
			}
		}
		
        function updateHpModel() {
        	var end = pathData;
        	var hpath = [];
        	for ( var i = frameIndex; i <= end; i++) {
				var n = data.networks[i];
				hpath.push(n);
			}
        	pathLabel = "Historical Path";
        	updateHPathModel(hpath);
		}
        
        function renderNodePanel() {
        	
        	if (!data) return;
        	
        	var state = data.networks[frameIndex].state;
        	
        	var distanceModel = [], 
        	map = state.distances;
			for (var groupId in map) {
				if (!map.hasOwnProperty(groupId)) continue;
				var entry = map[groupId];
				distanceModel.push({ 
					label: entry.group.id, 
					cssClass: entry.group.cssClass, 
					value: entry.value 
				});
			}
			
			updatePathModel();

			var model = {state: {label: state.vertex_id, cssClass: state.group.cssClass}, 
        				description: stateMapper.parseNode(state.vertex_id),
        				group: state.group.id,
        				quarterCount: state.visit_list_full.length,
       	             	quarters: state.visit_list,
       	             	pagerank: formatProbability(selfLinksEnabled ? state.pagerank_loops : state.pagerank),
       	             	distances: distanceModel,
       	             	pathLabel: pathLabel, 
       	             	path: pathModel};

            showNodePanel();
            nodePanel.call(nodePanelView.withModel(model));
            
            if (pathModel.length) {
				document.getElementById("path").scrollIntoView();
			}
        }

        function formatProbability(prob) {
        	return format(prob || 0);
        }

        function renderLinkPanel() {

            if (!data) return;
            
            var model = {from: {label: link.from.vertex_id, cssClass: link.from.group.cssClass},
            		to: {label: link.to.vertex_id, cssClass: link.to.group.cssClass},
            		transition_count: link.transition_count,
            		transition_list: link.transition_list,
            		transition_prob: formatProbability(link.transition_prob)};

            showLinkPanel();
            linkPanel.call(linkPanelView.withModel(model));
        }

        function createPanelContainer(cssClass) {
            var panel = container.selectAll("."+cssClass).data([0]);
            panel.enter()
                .append("div")
                .attr("class", "panel "+cssClass)
                .style("height", $(container.node()).height());

            return panel;
        }

        function showNodePanel() {
            linkPanel.style("display", "none");
            nodePanel.style("display", "block");
        }

        function showLinkPanel() {
            nodePanel.style("display", "none");
            linkPanel.style("display", "block");
        }

        Dispatcher.on("selectLink.panel", function(alink) {
            link = alink;
            renderLinkPanel();
        });
		
		Dispatcher.on("update.panel", function(framePos) {
			frameIndex = framePos;
            renderNodePanel();
        });
		
		Dispatcher.on("changeMode.panel", function(amode, p) {
			mode = amode;
			pathData = p;
			renderNodePanel();
		});

		Dispatcher.on("data.panel", function(adata) {
			data = adata.microState;
			mode = Dispatcher.MODE.DEFAULT;
			renderNodePanel();
        });
		
        Dispatcher.on("changeSelfLinksEnabled."+options.cssClass, function(aselfLinksEnabled) {
            selfLinksEnabled = aselfLinksEnabled;
			renderNodePanel();
        });

        nodePanel = createPanelContainer(options.nodePanelCssClass);
        linkPanel = createPanelContainer(options.linkPanelCssClass);
    }
    
    Panel.defaultOptions = {
        container: null,
    	initialFrame: 0,
        nodePanelCssClass: "nodePanelView",
        linkPanelCssClass: "linkPanelView"
    };

    return Panel;

});