define([
	"dispatcher",
	"services/groupmanager",
    "utils"
],

function(Dispatcher, GroupManager, Utils) {

	function DataProvider(opts) {

		var me = this,
		options = Utils.extend(DataProvider.defaultOptions, opts),
		groupManager = new GroupManager(),
		data = {
			microState: {},
			macroState: {}
		},
		nodesMap = {}, groupsMap = {}, networksMap = {};
		
		function getDataFolder() {
	    	var tokens = document.URL.split('/'),
	    	filename = tokens[tokens.length - 1];
	    	tokens = filename.split('.');
	    	var extension = tokens[tokens.length - 1],
	    	dataFolder = "./" + filename.substring(0, filename.length - extension.length - 1) + "_files/";
	    	return dataFolder; 
		}

		function load() {
			var dataFolder = getDataFolder();
			jsonp(dataFolder + options.paths.micro_network, { "onSuccess": function(response) {
				loadMicroState(response.data[0].nodes, response.data[0].links);
				jsonp(dataFolder + options.paths.scatter, { "onSuccess": function(response) {
					loadNetworks(response.data);
					calcMacroState();
					calcCategories();
					Dispatcher.trigger.call(me, "data", data);
					jsonp(dataFolder + options.paths.sp_vp, { "onSuccess": function(response) {
						loadSpVpLinks(response.data[0].links);
						calcDistances();
						Dispatcher.trigger.call(me, "data", data);
					}, "onTimeout": onTimeout });
				}, "onTimeout": onTimeout });
			}, "onTimeout": onTimeout });
		}
		
		function parseArray(str) {
			return str.split(',');
		}

		function loadMicroState(nodes, links) {
			data.microState.nodes = nodes;
			for ( var i = 0; i < data.microState.nodes.length; i++) {
				var node = data.microState.nodes[i];
				delete node.net_id;
				nodesMap[node.vertex_id] = node;
				if (!groupsMap[node.Group]) {
					groupsMap[node.Group] = { id: node.Group, cssClass: 'g' + node.Group, nodes: {}};
				}
				node.group = groupsMap[node.Group];
				delete node.Group;
				node.group.nodes[node.vertex_id] = node;
				node.fromLinks = {}; 
				node.toLinks = {};
				node.fromSpVpLinks = {}; 
				node.toSpVpLinks = {};
				// quarters/visit data is loaded from networks
				delete node.visit_count;
				delete node.visit_list_full;
				node.visit_list = parseArray(node.visit_list);
				node.visit_list_last = [];
			}
			data.microState.nodesMap = nodesMap;
			data.microState.groups = groupsMap;
			data.microState.links = links;
			for ( var i = 0; i < data.microState.links.length; i++) {
				var link = data.microState.links[i]; 
				delete link.net_id;
				var fromNode = nodesMap[link.from_id];
				link.from = fromNode;
				fromNode.fromLinks[link.to_id] = link; 
				var toNode = nodesMap[link.to_id];
				link.to = toNode;
				toNode.toLinks[link.from_id] = link;
				if (fromNode !== toNode) {
					var oppositeLink = fromNode.toLinks[link.to_id];
					if (oppositeLink) {
						link.hasOpposite = true;
						oppositeLink.hasOpposite = true;
					}
				}
				delete link.from_id;
				delete link.to_id;
		    	link.transition_list = parseArray(link.transition_list);
			}
		}
		
		function loadNetworks(networks) {
			data.microState.networks = networks;
			for ( var i = 0; i < networks.length; i++) {
				var network = networks[i];
				delete network.nodes;
				delete network.links;
				network.state = nodesMap[network.State];
				delete network.State;
				delete network.Group;
				network.state.visit_list_full = network.state.visit_list_full || [];
				network.state.visit_list_full.push(network);
				if (i == networks.length - 1 || 
						nodesMap[networks[i + 1].State] !== network.state) {
					network.state.visit_list_last.push(network);
				}
				network.index = i;
				networksMap[network.net_id] = network; 
			}
			for ( var i = 0; i < data.microState.links.length; i++) {
				var link = data.microState.links[i], transition_list_full = [],
				transitions = parseArray(link.transition_list_full);
				for ( var j = 0; j < transitions.length; j++) {
					transition_list_full.push(networksMap[transitions[j]]);
				}
				link.transition_list_full = transition_list_full;
			}
			updateGroupNetworks();
		}
		
		function updateGroupNetworks() {
			for (var groupId in groupsMap) {
				if (!groupsMap.hasOwnProperty(groupId)) continue;
				groupsMap[groupId].networks = [];
			}
			var networks = data.microState.networks;
			for ( var i = 0; i < networks.length; i++) {
				var network = networks[i];
				network.state.group.networks.push(network);
			}
		}
		
		function loadSpVpLinks(links) {
			for ( var i = 0; i < links.length; i++) {
				var link = links[i]; 
				delete link.net_id;
				var fromNode = nodesMap[link.from_id];
				fromNode.fromSpVpLinks[link.to_id] = link; 
				link.from = fromNode;
				var toNode = nodesMap[link.to_id];
				link.to = toNode;
				toNode.toSpVpLinks[link.from_id] = link;
				delete link.from_id;
				delete link.to_id;
				if (link.shortestpath) {
					var path = [], tokens = link.shortestpath.split('-');
			    	for ( var j = 0; j < tokens.length; j++) {
			    		path.push(nodesMap[tokens[j]]);
					}
			    	link.shortestpath = path;
				}
			}
		}
		
		Dispatcher.on("changeGroup", function(node, group) {
			delete node.group.nodes[node.vertex_id];
			node.group = group;
			node.group.nodes[node.vertex_id] = node;
			updateGroupNetworks();
			calcMacroState();
			calcCategories();
			calcDistances();
			Dispatcher.trigger.call(me, "data", data);
		});

		function groupQuarters(quarters) {
			var labels = [],
			start = 0;
			for (var i = 1; i < quarters.length + 1; i++) {
				if (i == quarters.length || quarters[i].index != quarters[i - 1].index + 1) {
					var label;
					if (start == i - 1) {
						label = quarters[start].net_id;
					} else {
						label = quarters[start].net_id + "-" + quarters[i - 1].net_id;
					}
					labels.push(label);
					start = i;
				}
			}
			return labels;
		}
		
		function calcCategories() {
			var keys = options.categories;
			for (var groupId in groupsMap) {
				if (!groupsMap.hasOwnProperty(groupId)) continue;
				groupsMap[groupId].categories = {};
				var categories = groupsMap[groupId].categories;
				for ( var i = 0; i < keys.length; i++) {
					var key = keys[i];
					categories[key] = {pos: 0, neg: 0, name: key};
				}
			}
			for ( var i = 0; i < data.microState.networks.length - 1; i++) {
				var na = data.microState.networks[i], nb = data.microState.networks[i + 1];
				if (na.state.group !== nb.state.group) continue;
				var categories = na.state.group.categories;
				for ( var j = 0; j < keys.length; j++) {
					var key = keys[j];
					if (nb[key] - na[key] > 0) {
						categories[key].pos++;
					} else {
						categories[key].neg++;
					}
				}
			}
		}
		
		function calcDistances() {
			for ( var i = 0; i < data.microState.nodes.length; i++) {
				var node = data.microState.nodes[i];
				groupManager.calcDistances(node);
			}
		}
		
		function calcMacroState() {
			var macroNodesMap = {};
			data.macroState.nodes = [];
			for (var groupId in groupsMap) {
				if (!groupsMap.hasOwnProperty(groupId)) continue;
				var group = groupsMap[groupId];
				var macroGroup = { id: group.id, cssClass: group.cssClass };
				var c = 0, x = 0, y = 0, pageRank = 0;
				for (var nodeId in group.nodes) {
					if (!group.nodes.hasOwnProperty(nodeId)) continue;
					var node = group.nodes[nodeId];
					c++;
					x += node.x;
					y += node.y;
					pageRank += (node.pagerank || 0);
				}
				if (c == 0) continue;
				var macroNode = { 
						vertex_id: macroGroup.id,
						x: x/c, 
						y: y/c, 
						pagerank: pageRank, 
						group: macroGroup,
						fromLinks: {}, 
						toLinks: {}
				}; 
				macroNodesMap[macroNode.vertex_id] = macroNode;
				data.macroState.nodes.push(macroNode);
			}
			data.macroState.nodesMap = macroNodesMap;
			var angle = 2 * Math.PI / data.macroState.nodes.length, r = 0.4;
			for ( var i = 0; i < data.macroState.nodes.length; i++) {
				var macroNode = data.macroState.nodes[i];
				macroNode.x = Math.cos(angle*i) * r;
				macroNode.y = Math.sin(angle*i) * r;
			}
			data.macroState.links = [];
			for ( var i = 0; i < data.microState.links.length; i++) {
				var link = data.microState.links[i];
				var fromNode = macroNodesMap[link.from.group.id];
				var macroLink = fromNode.fromLinks[link.to.group.id];
				if (!macroLink) {
					macroLink = {
							arc_id: link.from.group.id + "-" + link.to.group.id,
							transition_count: 0,
							transition_list_full: []
					};
					data.macroState.links.push(macroLink);
				}
				macroLink.transition_count += link.transition_count;
				macroLink.transition_list_full = macroLink.transition_list_full.concat(link.transition_list_full);
				fromNode.fromLinks[link.to.group.id] = macroLink; 
				macroLink.from = fromNode;
				var toNode = macroNodesMap[link.to.group.id];
				toNode.toLinks[link.from.group.id] = macroLink;
				macroLink.to = toNode;
				if (fromNode !== toNode) {
					var oppositeLink = fromNode.toLinks[link.to.group.id];
					if (oppositeLink) {
						macroLink.hasOpposite = true;
						oppositeLink.hasOpposite = true;
					}
				}
			}
			
			for ( var i = 0; i < data.macroState.links.length; i++) {
				var macroLink = data.macroState.links[i];
				macroLink.transition_list_full.sort(function (a, b) {
					if (a.index < b.index) return -1;
					if (a.index > b.index) return 1;
					return 0;
				});
				macroLink.transition_list = groupQuarters(macroLink.transition_list_full);
			}

		}
			
		function onTimeout() {
			console.log("timeout");
		}

		function jsonp(src, options) {
		    var callback_name = options.callbackName || 'callback',
		      on_success = options.onSuccess || function(){},
		      on_timeout = options.onTimeout || function(){},
		      timeout = options.timeout || 20; // sec

		    var timeout_trigger = window.setTimeout(function(){
		      window[callback_name] = function(){};
		      parent.removeChild(script);
		      on_timeout();
		    }, timeout * 1000);

		    window[callback_name] = function(data){
		      window.clearTimeout(timeout_trigger);
		      parent.removeChild(script);
		      on_success(data);
		    };

		    var parent = document.getElementsByTagName('head')[0];
		    var script = document.createElement('script');
		    script.type = 'text/javascript';
		    script.async = true;
		    script.src = src;
		    parent.appendChild(script);
		};

		load();
	}
	
	DataProvider.defaultOptions = {
		paths : {
			micro_network: 'micro_network.js',
			scatter: 'scatter.js',
			sp_vp: 'sp_vp.js'
		}, 
		categories: []
	};

	return DataProvider;
});