define([

],
function() {

    function Callout(aclassSelector) {
        var str = "...", x = 0, y = 0, position = "top", padding = 4, arrow = 3, classSelector = aclassSelector;
        var fn = function(selection) {
            var g = selection.selectAll("g."+classSelector).data([0]);
            var gEnter = g.enter().append("g")
                .attr("class", classSelector)
                .classed("callout", true);

            gEnter.append("path");
            gEnter.append("text").attr("text-anchor", "middle");
            g.attr("transform", "translate(" + x + "," + y + ")");
            var text = g.select("text");
            text.text(str);
            var bbox = text.node().getBBox();
            var tw = bbox.width;
            var th = bbox.height;
            var vOffset = (position === "bottom") ? th + arrow + padding
                : -arrow - padding;
            text.attr("dy", vOffset);
            g.select("path").attr(
                "d", calloutPath(position, tw + padding * 2, th + padding * 2,
                    arrow));
            return fn;
        };
        fn.text = function(t) {
            str = t;
            return fn;
        };
        fn.translate = function(tx, ty) {
            x = tx, y = ty;
            return fn;
        };
        fn.pos = function(pos) {
            position = pos;
            return fn;
        };
        return fn;
    };

    var calloutPath = function(position, w, h, arrow) {
        var params = {
            w : w,
            hw : w / 2 - arrow,
            h : h,
            a : arrow
        };
        var regex = /{([^}]+)}/g;
        var result = calloutPath.template[position].replace(regex, function(_, key) {
            return params[key];
        });
        return result;
    };
    calloutPath.template = {
        top : "M0,0 l{a},-{a} h{hw} v-{h} h-{w} v{h} h{hw} Z",
        bottom : "M0,0 l{a},{a} h{hw} v{h} h-{w} v-{h} h{hw} Z"
    };

    return Callout;
});