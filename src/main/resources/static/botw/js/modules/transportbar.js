/**
 * @author Dmitry Zemnitskiy (pragmasoft)
 * @module TransportBar
 */

define([
    "d3",
    "dispatcher",
    "utils",
    "components/axes",
    "components/callout",
    "components/serie",
    "components/knob",
    "components/brush"
],
function(d3, Dispatcher, Utils, Axes, Callout, Serie, Knob, Brush) {



	function ChartGroup(opts, adata) {
		var me = this, svg, chart, x, y, series, 
			options = opts, knob, tooltip, data = adata, length = data.length, opacity = 0,
            prevFrame, knobPos,
			dragActive = false;
		
		var render = function(selection) {
            console.log("render");

            var classSelector = options.cssClass,
				paddings = options.paddings,
				dimensions = options.dimensions;

			var g = selection.selectAll("g." + classSelector).data([0]);
			g.enter().append("g")
				.attr("class", classSelector)
				.append("rect")
				.attr("class", "background")
				.attr("width", dimensions.width)
				.attr("height", dimensions.height);

			chart = selection.select("g." + classSelector)
				.style("opacity", opacity)
				.attr("transform", d3.svg.transform().translate(paddings.left, paddings.top));

			var charts = chart.selectAll("g.charts").data([0]);
			charts.enter().append("g").attr("class", "charts");
			
			if (series && options.axes.y) {
				y = Axes.YAxis(Utils.extend(options.axes.y, { height: dimensions.height, renderTicks: false} ), series);
				charts.call(y);
			};

			x = Axes.XAxis(Utils.extend(options.axes.x, {
				width: dimensions.width,
				height: dimensions.height,
				x: 0,
				y: dimensions.height,
                source: options.series[0].source
			}), data);
			charts.call(x);
			
			if (series) series.forEach(function(serie) {
				charts.call(serie.withXAxis(x).withYAxis(y));
			});
			
			knob = knob || Knob({ height: dimensions.height, transitionTime: options.transitionTime, cssClass: "tbKnob"});
			chart.call(knob);

			tooltip = tooltip || Tooltip({ 
				height: dimensions.height, 
				transitionTime: options.transitionTime, 
				series: options.seriesValueLabelsEnabled ? options.series : null
			});
			chart.call(tooltip);

            if (opacity) {
				d3.select("rect.dragArea")
					.on("mousedown."+classSelector, dragStart)
					.on("mousemove."+classSelector, drag)
					.on("mouseover."+classSelector, mouseIn)
					.on("mouseout."+classSelector, mouseOut);
			} else {
				d3.select("rect.dragArea")
					.on("mousedown."+classSelector, null)
					.on("mousemove."+classSelector, null)
					.on("mouseover."+classSelector, null)
					.on("mouseout."+classSelector, null);
			}

			return this;
		}


		function dragStart() {
            Dispatcher.trigger("pause");
			d3.select(document).on("mouseup.tbKnob",dragEnd);
			drag.call(this);
			dragActive = true;
			hideTooltip();
		};

		function mouseIn() {
			if (!dragActive) showTooltip();
		};

		function mouseOut() {
			hideTooltip();
		};

		function drag() {
			var extent = x.extent();
			var xp = d3.mouse(chart.node())[0];
			xp = Math.max(extent[0], Math.min(extent[1], xp));
			var i = x.index(xp);
			var val = x.val(i);
			if (x.tickFormat) {
				val = x.tickFormat(val);
			}
			if (tooltip) chart.call(tooltip.translate(i).text(val));
			if (knob && dragActive)	chart.call(knob.translate(xp, 0).calloutText(val));
		};

		function dragEnd() {
			d3.select(document).on("mouseup.tbKnob",null);
			dragActive = false;
			showTooltip();
			var xp = d3.mouse(chart.node())[0];
			var i = x.index(xp);
			i = i < 0 ? 0 : i >= data.length ? data.length - 1 : i;
            Dispatcher.trigger.call(me, "update", i);
		};

        function keyDown() {
            var e = d3.event;
            if (e.shiftKey) {

            }
        };

		render.withBrush = function(brush) {
			brush.withX(x);
			return render;
		};
		
		render.withSeries = function(aseries) {
			series = aseries;
			return render;
		};

		render.show = function() {
			opacity = 1;
			return render;
		}; 

		render.hide = function() {
			opacity = 0;
			return render;
		}; 

		function showTooltip() {
			if (tooltip) chart.call(tooltip.show());
		}; 

		function hideTooltip() {
			if (tooltip) chart.call(tooltip.hide());
		};
		
		render.update = function(i, animate) {
            var quarters = data[i].state.visit_list_full;
            var quartersPos = [];

            quarters.forEach(function(d, i) {
                quartersPos.push(x.key(d.net_id));
            });

            /* Remove `quarterSelected` class from all rect. */
            var nodes = d3.selectAll(".transportBar .serie.highlights rect").classed("quarterSelected", false);
            /* Add `quarterSelected` class to selected quarters. */
            nodes.each(function(d, i) {
                if (quartersPos.indexOf(i) >= 0) {
                    d3.select(this).classed("quarterSelected", true);
                }
            });

			if (knob) {
				var xp = x.pos(i);
				var val = x.val(i);
				if (x.tickFormat) {
					val = x.tickFormat(val);
				}
				var f = animate == false ? knob.translate : knob.animate;   
				chart.call(f.call(me, xp, 0).calloutText(val));
			}
		}

		function Tooltip(options) {
			var h = options.height,
			g, labels, callout = Callout('tooltip');
			function render(selection) {
				g = selection.selectAll("g.tooltip").data([0]);
				g.enter()
					.append("g")
						.style("opacity", 1e-6)
						.attr("class", "tooltip")
							.append("line")
							.attr("class", "cursor")
							.attr("y1", h);
				var t = selection.select("g.tooltip");
				t.call(callout)
				if (!labels) {
					labels = [];
					if (options.series) {
						for (var i = 0, len = options.series.length; i < len; i++) {
							labels.push(Label({ index: i, needCircle: options.series[i].type == 'line', color: options.series[i].color, format: options.series[i].format }))
						}
					}
				}
				labels.forEach(function(label) {
					t.call(label);
				});
			};
			function translate(i) {
				if (g) {
					g.attr("transform", d3.svg.transform().translate(x.pos(i), 0));
					var hmax = 0;
					labels.forEach(function(label) {
						label.pos(i);
						hmax = label.height() > hmax ? label.height() : hmax;
					});
					labels.sort(function(a, b) {
						var va = a.str();
						var vb = b.str();
					    return va > vb ? -1 : va < vb ? 1 : 0;
					});
					var padding = labels.length > 1 ? (h-2*hmax)/3 : (h-hmax)/2;
					var curX = 0, curY = padding;
					var wmax = 0;
					for (var i = 0, len = labels.length; i < len; i++) {
						labels[i].translate(curX, curY);
						curY += padding + labels[i].height();
						wmax = labels[i].width() > wmax ? labels[i].width() : wmax;
						if (i % 2) {
							curX += wmax;
							curY = padding;
							wmax = 0;
						}
					}
				}
				return render;
			};
			function show() {
				if (g) {
					g.transition()
					 .duration(options.transitionTime)
					 .style("opacity", 1);
				}
				return render;
			};
			function hide() {
				if (g) {
					g.transition()
					 .duration(options.transitionTime)
					 .style("opacity", 1e-6);
				}
				return render;
			};
			function pos(pos) {
				return render;
			};
			function text(t) {
				callout.text(t);
				return render;
			};
			function Label(options) {
				var index = options.index, classSelector = "s" + index, position = 0, paddingX = 8, paddingY = 5, shift = 10, xr = 0, yr = 0, str;
				var width, height, needCircle = options.needCircle, color = options.color || null,
                    format = options.format && typeof options.format == "function" ? options.format : d3.format(options.format ? options.format : "g");
				var render = function(selection) {
					var g = selection.selectAll("g.label."+classSelector).data([0]);
					var gEnter = g.enter().append("g").attr("class", "label " + classSelector).style("fill", color).style("stroke", color);
					gEnter.append("rect").attr("rx", 6).attr("ry", 6);
					gEnter.append("text").attr("class", "shadow").attr("text-anchor", "middle");
					gEnter.append("text").attr("class", "main").attr("text-anchor", "middle");
					if (needCircle) {
						gEnter.append("circle").attr("r", "3").attr("cx", "0").attr("cy", "0");
					}
					if (!y) return;
					var text = g.select("text.main");
					var shadow = g.select("text.shadow");
					var yp = y.scale(str);
					text.text(format(str));
					shadow.text(format(str));
					var bbox = text.node().getBBox();
					var xt = position < length/2 ? -bbox.x+paddingX+shift+xr : -bbox.x-paddingX-shift-bbox.width-xr;
					var yt = -bbox.y + paddingY + yr;
					text.attr("transform", d3.svg.transform().translate(xt, yt));
					shadow.attr("transform", d3.svg.transform().translate(xt + 1, yt + 1));
					var rect = g.select("rect");
					rect.attr("transform", d3.svg.transform().translate(xt, yt));
					rect.attr("x", bbox.x-paddingX)
					rect.attr("y", bbox.y-paddingY)
					width = bbox.width+paddingX*2;
					height = bbox.height+paddingY*2;
					rect.attr("width", width);
					rect.attr("height", height);
					if (needCircle) {
					  	var circle = g.select("circle");
					   	circle.attr("transform", d3.svg.transform().translate(0, yp));
					}
				};
				render.str = function() {
					return str;
				};
				render.width = function() {
					return width;
				};
				render.height = function() {
					return height;
				};
				render.translate = function(x, y) {
					xr = x;
					yr = y;
					return render;
				};
				render.pos = function(pos) {
					position = pos;
					if (series) {
						str = series[index].domain[position]["net_id"];
					}
					return render;
				};
				return render;
			};

			render.translate = translate;
			render.show = show;
			render.hide = hide;
			render.text = text;
			return render;
		};

		return render;
	}

	/**
	 * @constructor
	 * @param containerElement dom element to which transport bar ui will be added
	 * @param data data array
	 * @param options  options.transportBar 
	 * @returns {TransportBar}
	 */
	function TransportBar(opts) {
		var me = this,
            options = Utils.extend({}, TransportBar.defaultOptions, opts),
            data, networks,
            series = [], brush,
			svg, nodeId,
            outer, paddings, dimensions,
            mainChart, hoverChart,  frameIndex;

		function init() {
            outer = options.dimensions;
            paddings = options.paddings;
            dimensions = {
                width : outer.width - paddings.left - paddings.right,
                height : outer.height - paddings.top - paddings.bottom
            };

            brush = Brush({ height: dimensions.height, paddings: paddings, transitionTime: options.transitionTime});
            d3.select(document).on("keydown", onKeyDown);
			render();
			update(frameIndex || options.initialFrame, false);
		}

		function selectNode(id) {
			nodeId = id;
			render();
		};

		function render() {
			var selection = d3.select(options.container);
			var container = selection.selectAll("div."+options.cssClass).data([0]);
            container.enter()
                .append("div")
                .attr("class", options.cssClass);

            container.selectAll("svg").data([0]).enter().append("svg");
            /*d3.select("svg").on("keydown", function() {
                console.log(d3.event);

            })*/

            mainChart = ChartGroup({
                cssClass: "chart",
                paddings: paddings,
                dimensions: dimensions,
                axes: options.axes,
                transitionTime: options.transitionTime,
                series: options.series,
                seriesValueLabelsEnabled: options.seriesValueLabelsEnabled
            }, networks);

            var barWidth;
            if (options.series) {

                for (var i = 0, len = options.series.length; i < len; i++) {
                    var domain = data.microState.networks.map(function(d, i) {
                        var obj = {};
                        obj.net_id = d.net_id;
                        obj.cssClass = d.state.group.cssClass;
                        return obj;
                    });
                    barWidth = ~~(dimensions.width / domain.length) + 1;
                    series.push(Serie(Utils.extend(options.series[i], {
                        width: dimensions.width,
                        barWidth: barWidth,
                        index: i,
                        barCssClassGetter: function(d) {return d.cssClass;},
                        format: function(str) {return str;}
                    }), domain));
                };

                // TODO: move this to options or somewhere else.
                /* Add serie for highlights. */
                series.push(Serie({
                    classSelector: "highlights",
                    width: dimensions.width,
                    barWidth: barWidth,
                    h: options.highlight.height , // Bar height.
                    y: dimensions.height - options.highlight.height, // Bar y position.
                    index: series.length
                }, domain));

                mainChart.withSeries(series);
            }

            if (options.vseries) {
                hoverChart = ChartGroup({
                    cssClass: "hoverchart",
                    paddings: paddings,
                    dimensions: dimensions,
                    axes: options.axes,
                    transitionTime: options.transitionTime,
                    series: options.vseries,
                    seriesValueLabelsEnabled: options.vseriesValueLabelsEnabled
                }, data);
            }

            container.selectAll("div#seriesLabel").data([0]).enter().append("div").attr("id", "seriesLabel").style("padding-left", options.paddings.left+"px");

            selection.node().appendChild(container.node());

			svg = container.select("svg")
					.attr("width", outer.width)
					.attr("height", outer.height);
			
			var g = svg.selectAll("g.chartgroups").data([0]);
			g.enter().append("g").attr("class", "chartgroups");

			var r = svg.selectAll("rect.dragArea").data([0]);
			r.enter().append("rect")
				.attr("class", "dragArea")
				.attr("width", outer.width)
				.attr("height", outer.height);

			if (options.vseries && nodeId) {
				var nodeSeries = [];
				for (var i = 0, len = options.vseries.length; i < len; i++) {
					var domain = data.map(numObjectProperty('nodesMap', nodeId, options.vseries[i].source));
					nodeSeries.push(Serie(Utils.extend(options.vseries[i], { width: outer.width, index: i }), domain));
				};
				g.call(mainChart.hide());
				g.call(hoverChart.withSeries(nodeSeries).show());
			} else {
				if (hoverChart) g.call(hoverChart.hide());
				g.call(mainChart.show());
			}
			updateSeriesLabel();

            mainChart.withBrush(brush);
            svg.call(brush);

            return this;
		};
		
		function update(i, animate) {
			frameIndex = i;
			mainChart.update(i, animate);
			if (hoverChart) hoverChart.update(i, animate);
			updateSeriesLabel();
		}

        Dispatcher.on("update.tb", function(framePos) {
            //update(framePos);
        });
		
		function updateSeriesLabel() {
			d3.select("#seriesLabel").text(options.vseries && options.vseriesLabel && nodeId ?
					objectProperty('nodesMap', nodeId, options.vseriesLabel).call(me, data[frameIndex], 0) : options.seriesLabel);
		}

        function onKeyDown() {
            var e = d3.event;
            if      ((e.keyCode || e.which) == 38) { Dispatcher.trigger("up"); }
            else if ((e.keyCode || e.which) == 40) { Dispatcher.trigger("down"); }
        }

        function numProperty(name) {
            return function(d, i) {
                return +d[name];
            };
        };

        function objectProperty(objectName, key, name) {
            return function(d, i) {
                var n = d[objectName][key];
                return n ? n[name] : '';
            };
        };

        function numObjectProperty(objectName, key, name) {
            return function(d, i) {
                var n = d[objectName][key];
                return n ? +n[name] : 0;
            };
        };

        Dispatcher.on("update", function(framePos) {
            update(framePos);
        });
        
        Dispatcher.on("selectNode", function(index) {
        	selectNode(index);
        });

        Dispatcher.on("data."+options.cssClass, function(adata) {
            data = adata;
            networks = data.microState.networks;
            init();
        });

        TransportBar.prototype.render = render;
	};

	TransportBar.defaultOptions = {
        cssClass: 'transportBar',
		initialFrame : 0,
		loopInterval : 2000,
		transitionTime : 1000,
		paddings : {
			top : 20,
			right : 20,
			bottom : 5,
			left : 30
		},
		dimensions : {
			width : 800,
			height : 55
		},
		axes : {
			x : {
				scale : "ordinal"
			}
		},
        highlight: {
            height: 4
        },
		seriesValueLabelsEnabled:true,
		vseriesValueLabelsEnabled:true
	};

    return TransportBar;
});
