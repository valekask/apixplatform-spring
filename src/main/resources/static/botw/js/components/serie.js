define([
    "d3"
], function(d3) {

    var Serie = function(options, data) {
        var s = Serie[options.type] || bar;
        return s(options, data);
    };

    var bar = function(opts, domainIn) {
        var options = opts,
            domain = domainIn,
            index = options.index,
            classSelector = options.classSelector || ("s" + index),
            transitionDuration = options.transitionDuration || 0,
            defaultCssClass = "bar",
            withLabels,
            withPercents,
            barCssClassGetter = options.barCssClassGetter || new Function(),
            format = d3.format("f"),
            x, y, h, hw = options.barWidth / 2 || ~~(options.width / domain.length / 4) + 1;
        var render = function(selection) {
            var g = selection.selectAll("g.serie."+classSelector).data([0]);
            g.enter().append("g").attr("class", defaultCssClass + " serie " + classSelector);
            
            var bars = g.selectAll("rect").data(domain);
			
            bars.enter()
				.append("rect");

            bars.exit()
        		.transition().duration(options.transitionTime)
        		.style("opacity", "0")
        		.remove();
			
            bars
            	.attr("class", barCssClassGetter)
                .classed("bar", true)
                .classed("negative", isNegative)
            	.attr("data-val", identity)
            	.transition().duration(transitionDuration)
            	.attr("x", x)
                .attr("width", hw * 2)
                .attr("y", y)
                .attr("height", h);

            if (typeof withLabels === "function") {
                withLabels(selection);
            }

            if (typeof withPercents === "function") {
                withPercents(selection);
            }
        };
        render.withXAxis = function(ax) {
            x = function(d, i) { return ax.pos(i) - hw };
            return render;
        };
        render.withYAxis = function(ay) {
            y = options.y || function(d) { return Math.min(ay.scale(d), ay.scale(0)); }
            h = options.h || function(d) { return Math.abs(ay.scale(d) - ay.scale(0)); }
            return render;
        };
        render.withLabels = function(labelTexts) {
            withLabels = function(selection) {
                var g = selection.selectAll("g.serie."+classSelector);
                var paddings = {
                    topRow1: -30,
                    topRow2: -17
                }

                g.selectAll("text.label").data(domain)
                    .enter().append("text")
                    .attr("class", "label");

                g.selectAll("text.label")
                    .attr("x", function(d, i) { return x(d,i) + hw; })
                    .attr("y", function(d, i) { return i % 2 == 0 ? paddings.topRow1 : paddings.topRow2; })
                    .attr("text-anchor", "middle")
                    .text(function(d, i) { return labelTexts[i] });
            }

            return render;
        }

        render.withPercents = function(percentData, position, cssClass) {
            position = position === "top" || position === "bottom" ? position : "top";
            withPercents = function(selection) {
                var g = selection.selectAll("g.serie."+classSelector);
                var paddings = {
                    top: -5,
                    bottom: 12,
                    left: 4
                }

                /* Add positive percent label. */
                g.selectAll("text."+cssClass).data(domain)
                    .enter().append("text")
                    .attr("class", cssClass)
                    .classed("percentLabel", true);

                g.selectAll("text."+cssClass).transition().duration(transitionDuration)
                    .attr("x", function(d, i) { return x(d, i) + hw + paddings.left; })
                    .attr("y", position == "top" ? getTopY : getBottomY)
                    .attr("text-anchor", "middle")
                    .text(function(d, i) { return format(percentData[i]) + "%"; });

                function getTopY(d) {
                    return y(d) + paddings.top;
                }

                function getBottomY(d) {
                    return y(d) + h(d) + paddings.bottom;
                }

            }

            return render;
        }

        render.domain = domain;
        return render;
    };

    var line = function(opts, domainIn) {
        var options = opts,
            domain = domainIn,
            index = options.index,
            classSelector = "s" + index,
            line = d3.svg.line(),
            color = options.color || null;
        function render(selection) {
            var g = selection.selectAll("g.serie."+classSelector).data([0]);
            g.enter()
                .append("g")
                .attr("class", "line serie " + classSelector)
                .style("fill", color).style("stroke", color)
                .append("path");
            g.selectAll("path").attr("d", line(domain));
        };
        render.withXAxis = function(ax) {
            line.x(function(d, i) { return ax.pos(i) } );
            return render;
        };
        render.withYAxis = function(ay) {
            line.y(ay.scale);
            return render;
        };
        render.domain = domain;
        return render;
    };

    function isNegative(d, i) {
        return d < 0;
    };

    function identity(d) {
        return d;
    };

    return Serie;
});