define([
],
function() {

	function GroupManager(options) {
		var module = {};
		
		module.calcDistances = function(node) {
			var map = {};
			for (var linkId in node.fromSpVpLinks) {
				if (!node.fromSpVpLinks.hasOwnProperty(linkId)) continue;
				var link = node.fromSpVpLinks[linkId],
				group = link.to.group;
				updateDistance(map, group, link.rwd);
			}
			for (var linkId in node.toSpVpLinks) {
				if (!node.toSpVpLinks.hasOwnProperty(linkId)) continue;
				var link = node.toSpVpLinks[linkId],
				group = link.from.group;
				updateDistance(map, group, link.rwd);
			}
			node.distances =  map;
		}
		
		function updateDistance(map, group, value) {
			var model = map[group.id];
			if (!model) {
				map[group.id] = { group: group, value: value };
			} else {
				model.value = model.value === undefined || value < model.value ? value : model.value; 
			}
		} 
		
		module.calcClosestDistanceInGroup = function(node) {
			var val;
			for (var linkId in node.fromSpVpLinks) {
				if (!node.fromSpVpLinks.hasOwnProperty(linkId)) continue;
				var link = node.fromSpVpLinks[linkId],
				groupId = link.to.group.id;
				if (node.group.id != groupId) continue;
				if (val === undefined) {
					val = link.rwd;
				} else {
					val = link.rwd < val ? link.rwd : val; 
				}
			}
			return val;
		}

		return module;
	};
    return GroupManager;
});
