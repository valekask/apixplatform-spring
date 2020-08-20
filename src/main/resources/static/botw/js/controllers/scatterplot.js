define([
    "d3",
    "dispatcher",
    "components/dropdown",
    "views/scatterplotview",
    "views/buttonview",
    "views/boxplotview",
    "views/scatterpathview",
    "views/boxpathview",
    "utils"
],
function(d3, Dispatcher, DropDown, ScatterPlotView, ButtonView, BoxPlotView, ScatterPathView, BoxPathView, Utils) {

	function ScatterPlotController(opts) {
		var options = Utils.extend({}, ScatterPlotController.defaultOptions, opts),
		networks, groups,
		bindingModel = {
			x: {
				options: undefined,
				value: undefined
			},
			y: {
				options: undefined,
				value: undefined
			}
		},
		scatterPlotModel = {
			nodes: undefined,
			selectedNode: undefined,
			domains: undefined
		},
		boxPlotModel = {
			x: {
				groups: undefined,
				selectedNode: undefined,
				isOnHover: false
			},
			y: {
				groups: undefined,
				selectedNode: undefined,
				isOnHover: false
			}
		},
		pathData, pathModel = {
			nodes: undefined,
			groups: undefined,
			selectedNode: undefined
		}, mode = Dispatcher.MODE.DEFAULT,
		frameIndex, isOnHover = false,
		container = d3.select(options.container),
		panel = container.select(".scatterplotPanel"),
		scales = {x: d3.scale.linear(), y: d3.scale.linear()},
		scatterPlotView = new ScatterPlotView({
			model: scatterPlotModel,
			scales: scales,
			onZoom: onZoom,
			onNodeClick: onNodeClick,
			onNodeHover: onNodeHover
		}),
		scatterPathView = new ScatterPathView({
			model: pathModel
		}),
		xBoxPlotView = new BoxPlotView.X({
			model: boxPlotModel.x,
			scale: scales.x
		}),
		yBoxPlotView = new BoxPlotView.Y({
			model: boxPlotModel.y,
			scale: scales.y
		}),
		boxPathView = new BoxPathView({
			model: pathModel
		}),
		xBindingView = new DropDown({
			cssClass: "x-binding-dropdown",
			label: "X:",
			model: bindingModel.x,
			onChange: onBindingChange
		}),
		yBindingView = new DropDown({
			cssClass: "y-binding-dropdown",
			label: "Y:",
			model: bindingModel.y,
			onChange: onBindingChange
		}),
		resetButtonView = new ButtonView({
			cssClass: "scatter-scale-reset",
			label: "Reset Scale",
			onClick: onResetScale
		});
		
		function updateBindingModel() {
			var opts = [];
	        d3.map(networks[0]).forEach(function(key,val){
	            if (!isNaN(val) && key != "net_id" && key != "index") {
	            	opts.push({label: key, value: key});
	            }
	        });
	        if (networks[0][options.key_x] === undefined) options.key_x = opts[0].value; 
	        if (networks[0][options.key_y] === undefined) options.key_y = opts[1].value;
			bindingModel.x.options = opts;
			bindingModel.x.value = options.key_x;
			bindingModel.y.options = opts;
			bindingModel.y.value = options.key_y;
		}
		
		function updateModel() {
			updateScatterPlotModel();
			updateBoxPlotModel(boxPlotModel.x, bindingModel.x.value);
			updateBoxPlotModel(boxPlotModel.y, bindingModel.y.value);
		}
		
		function updateScatterPlotModel() {
			scatterPlotModel.nodes = [];
			networks.forEach(function(d) {
				var group = d.state.group;
				scatterPlotModel.nodes.push({
					id: d.net_id,
					x: d[bindingModel.x.value],
					y: d[bindingModel.y.value],
					groupId: group.id,
					cssClass: group.cssClass
				});
			});
			scatterPlotModel.domains = {
				x: d3.extent(scatterPlotModel.nodes, function(d) {return d.x;}),
				y: d3.extent(scatterPlotModel.nodes, function(d) {return d.y;})
			};
			checkDomainMin("x");
			checkDomainMax("x");
			checkDomainMin("y");
			checkDomainMax("y");
		}
		
		function checkDomainMin(key) {
			if (scatterPlotModel.domains[key][0] > 0) scatterPlotModel.domains[key][0] = 0;
		}
		
		function checkDomainMax(key) {
			if (scatterPlotModel.domains[key][1] < 0) scatterPlotModel.domains[key][1] = 0;
		}
		
		function updateBoxPlotModel(model, key) {
			model.groups = [];
			Utils.forEachProperty(groups, function(group) {
				var values = group.networks.map(function(d) {return d[key];}).sort(d3.ascending);
				model.groups.push({
					id: group.id,
					min: values[0],
					q1: d3.quantile(values, 0.25),
				    q2: d3.quantile(values, 0.5),
				    q3: d3.quantile(values, 0.75),
				    max: values[values.length-1],
				    groupId: group.id,
				    cssClass: group.cssClass
				});
			});
		}
		
		function setModelSelectedNode(d) {
			scatterPlotModel.selectedNode = d;
			boxPlotModel.x.selectedNode = d;
       		boxPlotModel.y.selectedNode = d;
		}
		
		function updateFrameIndex(framePos) {
			frameIndex = framePos;
			setModelSelectedNode(scatterPlotModel.nodes[frameIndex]);
		}
		
		function resetPathModel() {
			pathModel.nodes = null;
			pathModel.groups = null;
		}

		function updatePathModel() {
			switch (mode) {
//			case Dispatcher.MODE.TAIL:
//				updateTailModel();
//			    break;
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
				resetPathModel();
			    break;
			}
		}
		
//		function updateTailModel() {
//			var tailSteps = pathData;
//			if (!tailSteps) {
//				resetPathModel();
//				return;
//			}
//			var nodes = d3.set();
//			pathModel.nodes = d3.set();
//			pathModel.groups = d3.set();
//				
//	        var c = 0, cl = -1, next;
//	        for ( var i = frameIndex; c < tailSteps + 1 && i >= 0; i--) {
//	        	var network = networks[i];
//				var state = network.state;
//				pathModel.nodes.add(network.net_id);
//				pathModel.groups.add(state.group.id);
//		  		if (state !== next) {
//					if (!nodes.has(state.vertex_id)) {
//						nodes.add(state.vertex_id);
//						c++;
//					}
//					next = state;
//				}
//			}
//	    }

		function updateSpModel() {
			var node = networks[frameIndex].state.fromSpVpLinks[pathData];
			if (!node) { //not loaded yet
				resetPathModel();
				return;
			}
			var path = node.shortestpath;
			pathModel.groups = d3.set();
	    	if (!path) {
		    	pathModel.nodes = d3.set();
	    		return;
	    	}
	    	var nodes = [];
	    	path.forEach(function(node) {
	    		nodes.push.apply(nodes, node.visit_list_full.map(function(d) {return d.net_id}));
	    		pathModel.groups.add(node.group.id);
	    	});
	    	pathModel.nodes = d3.set(nodes);
		}
		
        function updateHpModel() {
        	var end = pathData;
        	pathModel.nodes = d3.set();
			pathModel.groups = d3.set();
			if (end) {
				for ( var i = frameIndex; i <= end; i++) {
		        	var network = networks[i];
					var state = network.state;
					pathModel.nodes.add(network.net_id);
					pathModel.groups.add(state.group.id);
				}
			}
		}

		function updateReachableModel() {
			var reachableData = pathData;
            var fromSpVpLinks = networks[frameIndex].state.fromSpVpLinks;
			pathModel.nodes = d3.set();
			pathModel.groups = d3.set();
                
            var prob = reachableData.prob / 100;
            var stepIndex = "vp" + reachableData.step;

            var nodes = [];
            for (var k in fromSpVpLinks) {
              	var p = fromSpVpLinks[k][stepIndex];
                if (p >= prob) {
                   	var path = fromSpVpLinks[k].shortestpath;
        	    	path.forEach(function(node) {
        	    		nodes.push.apply(nodes, node.visit_list_full.map(function(d) {return d.net_id}));
        	    		pathModel.groups.add(node.group.id);
        	    	});
                }
            }
            pathModel.nodes = d3.set(nodes);
        }

		function onZoom() {
			container.call(scatterPlotView.skipTransition());
			container.call(xBoxPlotView.skipTransition());
			container.call(yBoxPlotView.skipTransition());
		}
		
		function onNodeClick(d, i) {
			Dispatcher.trigger("changeMode", Dispatcher.MODE.DEFAULT);
			Dispatcher.trigger("update", i);
		}

		function setOnHover(d) {
        	isOnHover = !!d;
			boxPlotModel.x.isOnHover = isOnHover;
       		boxPlotModel.y.isOnHover = isOnHover;
		}

        function onNodeHover(d, i) {
        	setModelSelectedNode(d || scatterPlotModel.nodes[frameIndex]);
        	setOnHover(d);
       		render();
        }

		function onBindingChange() {
			updateModel();
			setModelSelectedNode(scatterPlotModel.nodes[frameIndex]);
			render();
		}
		
		function onResetScale() {
			updateModel();
			render();
		}
        
        Dispatcher.on("changeMode.scatterplot", function(amode, p) {
			mode = amode;
			pathData = p;
			updatePathModel();
            render();
		});

		Dispatcher.on("data.scatterplot", function(adata) {
			networks = adata.microState.networks;
			groups = adata.microState.groups;
			updateBindingModel();
			updateModel();
			updateFrameIndex(options.initialFrame);
			mode = Dispatcher.MODE.DEFAULT;
			updatePathModel();
			render();
        });

		Dispatcher.on("update.scatterplot", function(framePos) {
			updateFrameIndex(framePos);
			updatePathModel();
			render();
        });
		
 
		function render() {
			container
				.call(scatterPlotView)
				.call(xBoxPlotView)
				.call(yBoxPlotView);
			container.select("#scatterplot").call(scatterPathView);
			if (!isOnHover) {
				container.call(boxPathView);
			}
			panel
				.call(yBindingView)
				.call(xBindingView)
				.call(resetButtonView);
		}
	};
	
	ScatterPlotController.defaultOptions = {
       	key_x: "Unemp",
       	key_y: "GDP",
       	initialFrame: 0
	};

    return ScatterPlotController;
});
