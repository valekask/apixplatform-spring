define([
    "d3",
    "utils"
],
function(d3, Utils) {

    var Axis = {};

    Axis.XAxis = function(options, data) {
        var x = options.x || 0,
            y = options.y || 0,
            w = options.width,
            renderTicks = options.renderTicks != undefined ? options.renderTicks : true,
            halfstep, tickFormat,
            transitionDuration = options.transitionDuration || 0,
            prop = options.source ? options.sourceType === 'date' ? dateProperty(options.source) : property(options.source) : indexProperty,
            scale = Utils.Scale(options.scale),
            domain = data.map(prop), cachedExtent;
        scale.rangePoints([0, w], 0.5).domain(domain);
        halfstep = (pos(1)-pos(0))/2;

        if (options.sourceType == 'date') {
            tickFormat = d3.time.format("%Y-%m-%d");
        }
        function index(p) {
            var range = scale.range();
            return d3.bisect(range, p-halfstep);
        };
        function pos(i) {
            return scale(val(i));
        };
        function val(i) {
            return domain[i];
        };
        function key(val) {
            var v = -1;
            domain.forEach(function(d, i) {
                if (d == val) {
                    v = i;
                    return;
                }
            })
            return v;
        }
        function extent() {
            return cachedExtent || (cachedExtent = d3.extent(scale.range()));
        };
        function render(selection) {
            var g = selection.selectAll("g.axis.x").data([0]);
            g.enter().append("g").attr("class", "x axis");
            var axis = d3.svg.axis().scale(scale).orient("top")
                .tickFormat(tickFormat).tickSize(-6).tickPadding(y+6);

            if (renderTicks) {
                function returnOnlyNthTick(v, i) {
                    return i % tickNthElement == 0 || i == (domain.length - 1);
                }
                function findOutHowManyTicksCanInsert() {
                    var padding = 10,
                        tick = g.select(".tick text"),
                        tickWidth = g.select(".tick text").node().getBBox().width,
                        tickCount = Math.floor((w - (tickWidth + padding)) / (tickWidth + padding));
                    return tickCount > 0 ? tickCount :  0; // Don't return negative value.
                }

                // Render only first tick to find out its width.
                axis.tickValues([domain[domain.length - 1]]);
                g.attr("transform", d3.svg.transform().translate(x, y)).call(axis);
                var tickNthElement = Math.ceil(domain.length / findOutHowManyTicksCanInsert());
                var ticks = domain.filter(returnOnlyNthTick, tickNthElement);
                if (ticks.length > domain.length / tickNthElement) {
                    ticks[ticks.length-2] = ticks.pop(); // remove the one before last.
                }
                axis.tickValues(ticks);
            } else {
                axis.tickValues({}); // Do not render any ticks.
            }
            // Render the axe, or render one more time with all ticks if renderTicks option is true.
            g.transition().duration(transitionDuration).attr("transform", d3.svg.transform().translate(x, y)).call(axis);
            //g.call(axis);
        };
        render.scale = scale;
        render.pos = pos;
        render.extent = extent;
        render.index = index;
        render.val = val;
        render.key = key;
        render.tickFormat = tickFormat;
        return render;
    };

    Axis.YAxis = function(options, series) {
        var x = options.x || 0,
            y = options.y || 0,
            h = options.height,
            renderTicks = options.renderTicks != undefined ? options.renderTicks : true,
            transitionDuration = options.transitionDuration || 0,
            tickFormat = options.tickFormat || d3.format('.1f'),
            scale = Utils.Scale(options.scale),
            domain =  series.reduce(mergeDomains,[0,0]);
        scale.range([h, 0]).domain(domain);

        function render(selection) {
            var g = selection.selectAll("g.axis.y").data([0]);
            g.enter().append("g").attr("class", "y axis");
            var axis = d3.svg.axis().scale(scale).orient("left");
            if (renderTicks) {
                axis.ticks(3).tickFormat(tickFormat);
            } else {
                axis.tickValues({});
            }
            g.transition().duration(transitionDuration).attr("transform", d3.svg.transform().translate(x, y)).call(axis);
        };

        render.scale = scale;
        return render;
    };

    function mergeDomains(previous, serie) {
        var domain = d3.extent(serie.domain);
        domain = domain.concat(previous);
        return d3.extent(domain);
    };

    function dateProperty(name) {
		return function(d, i) {
			var localeDate = new Date(d[name]),
			utcDate = new Date(localeDate.getUTCFullYear(), localeDate.getUTCMonth(), localeDate.getUTCDate(),
					localeDate.getUTCHours(), localeDate.getUTCMinutes(), localeDate.getUTCSeconds(), localeDate.getUTCMilliseconds());
			return utcDate;
		};
	};

    function property(name) {
        return function(d, i) {
            return d[name];
        };
    };

    function indexProperty(d, i) {
        return i + 1;
    };



    return Axis;
});