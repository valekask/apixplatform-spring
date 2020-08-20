define([
    "d3",
    "utils",
    "components/callout"
],
function(d3, Utils, Callout) {

    var Knob = function(options) {
        var x = options.x || 0,
            y = options.y || 0,
            h = options.height,
            opacity,
            g,
            callout = Callout(options.cssClass+"CallOut");
        function render(selection) {
            g = selection.selectAll("g."+options.cssClass).data([0]);
            g.enter()
                .append("g")
                .attr("class", options.cssClass)
                .classed("cursor", true)
                .classed("knob", true)
                .append("line")
                .attr("y1", h);

            g.style("opacity", opacity);

            g.call(callout);
            translate(x, y);
        };
        function translate(xp, yp) {
            x = xp, y = yp;
            if (g) {
                g.attr("transform", d3.svg.transform().translate(x, y));
            }
            return render;
        };
        function animate(xp, yp) {
            x = xp, y = yp;
            if (g) {
                g.transition()
                    .duration(options.transitionTime)
                    .attr("transform", d3.svg.transform().translate(x, y));
            }
            return render;
        };
        function show() {
            opacity = 1;
            return render;
        };
        function hide() {
            opacity = 0;
            return render;
        };
        function text(text) {
            callout.text(text);
            return render;
        };

        render.translate = translate;
        render.animate = animate;
        render.text = text;
        render.calloutText = callout.text;
        render.show = show;
        render.hide = hide;

        return render;
    };

    return Knob;
});