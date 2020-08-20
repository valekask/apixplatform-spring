define([
	"d3"
],
function(d3) {

	function LabelPositioner(options) {
		var module = {};
		
		module.updateNodeLabels = function(labels, svgContainer, firstLoad) {
            /* From previous logic. need test. */
            var processed = [];
            function intersect(anode) {
                for (var i in processed) {
                    var node = processed[i];
                    if (node.x1 < anode.x2 && node.x2 > anode.x1 &&
                        node.y1 < anode.y2 && node.y2 > anode.y1) {
                        return true;
                    }
                }
                processed.push(anode);
                return false;
            }
            /* From previous logic. need test. */
            function updateOpacity(axt, axtFallback, ayt) {
                var xt = axt, xtFallback = axtFallback, yt = ayt;
                return function(d, i) {
                    var g = d3.select(this);
                    var cr = g.node().getBoundingClientRect();
                    if (options.transitionTime) {
                        g = g.transition().duration(options.transitionTime);
                    }
                    var a = intersect({ x1: cr.left, x2: cr.left+cr.width, y1: cr.top, y2: cr.top+cr.height}), xs = 0, opacity = 1;
                    if (a) {
                        if (!intersect({ x1: cr.left-xt+xtFallback, x2: cr.left+cr.width-xt+xtFallback, y1: cr.top, y2: cr.top+cr.height})) {
                            g.attr("transform", d3.svg.transform().translate(xtFallback, yt));
                        } else {
                            opacity = 0;
                        }
                    }
                    g.style("fill-opacity", opacity);
                };
            }

            var containerWidth = svgContainer.node().getBoundingClientRect().width;
            labels.each(function(d, i){
                var g = d3.select(this),
                    bbox = g.node().getBBox(),
                    padding = 5,
                    xtLeft  = -padding - d.r,
                    xtRight = padding + d.r,
                    anchor = "start",
                    xt;
                    //xtFallback;

                if ((bbox.x + bbox.width) < containerWidth) {
                    xt = xtRight;
                    //xtFallback = xtLeft;
                } else {
                    anchor = "end";
                    xt = xtLeft;
                    //xtFallback = xtRight;
                }
                var yt = bbox.height / 4;

                g.attr("text-anchor", anchor);

                if (!firstLoad) {
                    g = g.transition().duration(options.transitionTime);
                }
                g.attr("transform", d3.svg.transform().translate(xt, yt));//.each("end", updateOpacity(xt, xtFallback, yt));

            });
        }

		return module;
	};
    return LabelPositioner;
});
