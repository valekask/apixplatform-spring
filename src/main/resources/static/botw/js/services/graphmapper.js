define([
    "d3",
    "utils"
],
function(d3, Utils) {
	
	
	function GraphMapper(opts) {
		var options = Utils.extend({}, GraphMapper.defaultOptions, opts),
		px = options.mappings.node.r.range[1], py = options.mappings.node.r.range[1], 
		scales = {
			x: d3.scale.linear().domain([-0.5, 0.5]).range([px, options.dimensions.width - 2 * px]), 
			y: d3.scale.linear().domain([-0.5, 0.5]).range([options.dimensions.height - 2 * py, py]),
			r: d3.scale.linear().range(options.mappings.node.r.range)
		}, module = {};
		
		var linkPadding = 4, 
		selfLinkAngleSrc = Math.PI * 0.15, 
		selfLinkAngleDst = -selfLinkAngleSrc - Math.PI / 2;
		
		function getMarkerWidth(width) {
	        // from previous logic
	        return width / 2 + 3;
	    }

		module.updateRProperty = function(rProperty) {
			options.mappings.node.r.property = rProperty;
		}
		
		module.updateScales = function(adata) {
			scales.r.domain(d3.extent(adata.nodes, function(d) {return +d[options.mappings.node.r.property];}));
			return module;
		};
		
		function mapNodes(adata) {
			var nodes = [], nodesMap = {}, padding = 5;
			for ( var i = 0; i < adata.nodes.length; i++) {
				var anode = adata.nodes[i],
				x = scales.x(anode.x),
				y = scales.y(anode.y),
				r = scales.r(anode[options.mappings.node.r.property]) || options.mappings.node.r.def,
				labelPosition = {};
				if (anode.x < -0.16) {
					labelPosition.x = x-r-padding;
					labelPosition.anchor = "end";
				} else if (anode.x <= 0.16 && (anode.y < -0.16 || anode.y > 0.16)) {
					labelPosition.x = x;
					labelPosition.anchor = "middle";
				} else {
					labelPosition.x = x+r+padding;
					labelPosition.anchor = "start";
				}
				if (anode.y > 0.16) {
					labelPosition.y = y-r;
//					labelPosition.baseline = "text-after-edge";
				} else if (anode.y >= -0.16) {
					labelPosition.y = y;
					labelPosition.baseline = "middle";
				} else {
					labelPosition.y = y+r;
					labelPosition.baseline = "before-edge";
				}
				var node = {
					src: anode,
					id: anode.vertex_id,
                	label: anode.vertex_id,
                	labelOpacity: 1,
					x: x,
					y: y,
					r: r,
					cssClass: anode.group.cssClass,
					fromLinks: {}, 
					toLinks: {},
					labelPosition: labelPosition, 
					hoverPosition: [x, y-r],
					pagerank: anode[options.mappings.node.r.property] || 0
				};
				nodes.push(node);
				nodesMap[node.id] = node;
			}
			return {nodes: nodes, nodesMap: nodesMap};
		}

		function mapLinks(adata, nodesMap) {
			var links = [];
			for ( var i = 0; i < adata.links.length; i++) {
				var alink = adata.links[i],
				from = nodesMap[alink.from.vertex_id],
				to = nodesMap[alink.to.vertex_id],
                sX = from.x,
                sY = from.y,
                sR = from.r,
                tX = to.x,
                tY = to.y,
                tR = to.r,
                sangle, tangle, hidden;
                if (alink.from === alink.to) {
                    sangle = selfLinkAngleSrc;
                    tangle = selfLinkAngleDst;
//                	var angle = Math.PI * 0.15;
//                    sangle = Math.PI / 4 - angle;
//                    tangle = -Math.PI * 3 / 4 + angle;
                } else {
                    var vecX = tX - sX,
                    vecY = tY - sY,
                    sangle = Math.atan2(vecY, vecX);
                    tangle = sangle + Math.PI;
                    hidden = Math.sqrt(vecX*vecX+vecY*vecY) < sR + tR + 2 * linkPadding;
                }
                sX = Math.cos(sangle) * sR + sX;
                sY = Math.sin(sangle) * sR + sY;
                tX = Math.cos(tangle) * tR + tX;
                tY = Math.sin(tangle) * tR + tY;

                var label = alink.transition_list[alink.transition_list.length-1];
                var link = {
                	src: alink,
                	from: from,
                	to: to,
                	id: alink.arc_id,
                	label: label,
                	labelOpacity: 0,
                	x1: sX,
                	y1: sY,
                	x2: tX,
                	y2: tY,
                	hidden: hidden,
                	lastTransition: alink.transition_list_full[alink.transition_list_full.length - 1].net_id
                };
				links.push(link);	
                from.fromLinks[link.to.id] = link;
                to.toLinks[link.from.id] = link;
			}
			return links;
		}

		module.mapNodes = mapNodes;
		module.mapLinks = mapLinks;
		
		module.mapData = function(adata) {
			var data = mapNodes(adata);
			data.links = mapLinks(adata, data.nodesMap);
			return data;
		};
		
		module.xScale = function() {
			return scales.x;
		}

		module.yScale = function() {
			return scales.y;
		}
		
		module.resolveLinksPaths = function(dataModel) {
			for ( var i = 0; i < dataModel.links.length; i++) {
				var link = dataModel.links[i],
				linkPath = getLinkPath(link);
				link.path = linkPath.path;
				link.areaPath = linkPath.areaPath;
				link.markerWidth = getMarkerWidth(link.width);
				link.areaWidth = d3.max([link.width, link.markerWidth + 2]); 
				link.labelPosition = linkPath.labelPosition;
				link.hoverPosition = [link.labelPosition.x, link.labelPosition.y - link.areaWidth / 2];
				link.markerHidden = linkPath.markerHidden;
			}
		}
		
        function getLinkPath(link) {
            var sX = link.x1,
                sY = link.y1,
                tX = link.x2,
                tY = link.y2,
                vecX = tX - sX,
                vecY = tY - sY,
                angle = Math.atan2(vecY, vecX),
                h = options.marker.height * getMarkerWidth(link.width);

            var linkData = {
                sX: sX, sY: sY,
                tX: tX, tY: tY,
                vecX: vecX, vecY: vecY,
                angle: angle, h: h, 
                width: link.width,
                r: link.from.r
            }

            if (isSelfLink(link)) {
                return getSelfLinkPath(linkData);
            } if (isCurveLink(link)) {
                return getCurveLinkPath(linkData);
            } else {
                return getSimpleLinkPath(linkData)
            }
        }

        function getSimpleLinkPath(linkData) {
        	var h = 0, markerHidden = false,
        	dist = Math.sqrt(linkData.vecX*linkData.vecX+linkData.vecY*linkData.vecY);
            if (dist < linkData.h  + 2 * linkPadding) {
            	markerHidden = true;
            } else {
            	h = linkData.h;
            }
           	sX = Math.cos(linkData.angle) * linkPadding + linkData.sX,
            sY = Math.sin(linkData.angle) * linkPadding + linkData.sY;
           	tX = Math.cos(linkData.angle + Math.PI) * linkPadding + linkData.tX,
            tY = Math.sin(linkData.angle + Math.PI) * linkPadding + linkData.tY,
           	mtX = Math.cos(linkData.angle + Math.PI) * h + tX,
           	mtY = Math.sin(linkData.angle + Math.PI) * h + tY;
            return {
           		path: "M " + sX + " " + sY + " L " + mtX + " " + mtY,
           		areaPath: "M " + sX + " " + sY + " L " + tX + " " + tY,
            	labelPosition: {x: (sX + tX) / 2, y: (sY + tY) / 2},
            	markerHidden: markerHidden};
        }

        function getCurveLinkPath(linkData) {
        	var linkAngle = 0.25, labelAngle = 0.15, lengthRatio = 0.4;
            var dist = Math.sqrt(linkData.vecX*linkData.vecX+linkData.vecY*linkData.vecY), h = 0,
            markerHidden = false;
            if (dist < linkData.h  + 2 * linkPadding) {
            	markerHidden = true;
            } else {
            	h = linkData.h;
            }
            var cos = Math.cos(linkData.angle - linkAngle),
            sin = Math.sin(linkData.angle - linkAngle),
            cos2 = Math.cos(linkData.angle + Math.PI + linkAngle),
            sin2 = Math.sin(linkData.angle + Math.PI + linkAngle),
            sX = cos * linkPadding + linkData.sX,
            sY = sin * linkPadding + linkData.sY,
            tX = cos2 * linkPadding + linkData.tX,
            tY = sin2 * linkPadding + linkData.tY,
            mtX = cos2 * h + tX,
            mtY = sin2 * h + tY,
            vecX = sX - mtX,
            vecY = sY - mtY,
            dist2 = Math.sqrt(vecX*vecX+vecY*vecY),
            midX = Math.cos(linkData.angle - linkAngle) * dist2 * lengthRatio + sX,
            midY = Math.sin(linkData.angle - linkAngle) * dist2 * lengthRatio + sY,
            midX2 = cos2 * dist2 * lengthRatio + mtX,
            midY2 = sin2 * dist2 * lengthRatio + mtY,
            labelX = Math.cos(linkData.angle - labelAngle) * dist2 / 2 + sX,
            labelY = Math.sin(linkData.angle - labelAngle) * dist2 / 2 + sY,
            path = "M " + sX + " " + sY +
                	" C " + midX + " " + midY + " " + midX2 + " " + midY2 + 
                	" " + mtX + " " + mtY;

            return {
            	path: path,
            	areaPath: path + " L " + tX + " " + tY,
            	labelPosition: {x: labelX, y: labelY},
            	markerHidden: markerHidden};
        }

        function getSelfLinkPath(linkData) {
            var largeArc = 1, sweep = 0, ellipseScale = 1.3, ellipseRatio = 2,
            	markerAngle = -0.3 * Math.PI, // average
                dry = ellipseScale * (linkData.r + linkPadding),
                drx = ellipseRatio * dry, 
                y2 = (linkData.sX - linkData.tX) * (linkData.sX - linkData.tX) + (linkData.sY - linkData.tY) * (linkData.sY - linkData.tY),
                x2 = (1 - y2 / 4 / dry / dry) * drx * drx,
                x = Math.sqrt(x2),
                midX = (linkData.sX + linkData.tX) / 2,
                midY = (linkData.sY + linkData.tY) / 2,
                sX = Math.cos(selfLinkAngleSrc) * linkPadding + linkData.sX,
                sY = Math.sin(selfLinkAngleSrc) * linkPadding + linkData.sY,
                tX = Math.cos(selfLinkAngleDst) * linkPadding + linkData.tX,
                tY = Math.sin(selfLinkAngleDst) * linkPadding + linkData.tY;
                mtX = Math.cos(markerAngle) * linkData.h + tX,
                mtY = Math.sin(markerAngle) * linkData.h + tY,
                labelX = Math.cos(-Math.PI / 4) * (drx + x) + midX,
            	labelY = Math.sin(-Math.PI / 4) * (drx + x) + midY,
            	path = "M" + sX + "," + sY + "A" + drx + "," + dry + " -45," + largeArc + "," + sweep + " " + mtX + "," + mtY;
            return{
            	path: path,
            	areaPath: path + "L" + tX + "," + tY,
            	labelPosition: {x: labelX, y: labelY}};
        }

        function isSelfLink(link) {
            return link.src.from === link.src.to;
        }

        function isCurveLink(link) {
            return link.src.hasOpposite;
        }

		return module;
	};
	
	GraphMapper.defaultOptions = {
		mappings: {
			node: {
				r: {
					property: 'pagerank',
					range: [5.0,20.0],
					def: 5.0
				}
			},
			link: {
				width: {
					property: 'transition_count',
					range: [1.0,5.0],
					def: 2.0
				}
			}
		}
	};

    return GraphMapper;
});
