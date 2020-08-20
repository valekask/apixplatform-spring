define([
    "d3",
    "utils",
    "dispatcher",
    "components/knob"
],
function(d3, Utils, Dispatcher, Knob) {

    function Brush(opts) {
        var options = opts, brush, x, brushContainer,
            knobStart, knobEnd, knobCurrent, brushEnabled = false, brushStarted = false, model, mode = Dispatcher.MODE.DEFAULT, frameIndex = 0;

        var render = function(selection, data) {
            brush = brush || d3.svg.brush().x(x.scale).on("brushend", brushended).on("brushstart", brushstarted).on("brush", brushmove);

            selection.selectAll("g.brush").data([0])
                .enter().append("g")
                .attr("class", "brush")
                .attr("transform", d3.svg.transform().translate(options.paddings.left, options.paddings.top));

            brushContainer = selection.select("g.brush");

            brushContainer.call(brush);

            brushContainer.selectAll("rect").attr("height", options.height);

            knobStart = knobStart || new Knob({height: options.height, transitionTime: options.transitionTime, cssClass: "brushKnobStart"});
            knobEnd = knobEnd || new Knob({height: options.height, transitionTime: options.transitionTime, cssClass: "brushKnobEnd"});
            knobCurrent = knobCurrent || new Knob({height: options.height, transitionTime: options.transitionTime, cssClass: "brushKnobCurrent"});

            disableBrush();

            d3.select(window)
                .on("keydown.myBrush", onKeyDown) // don't override brush scope from d3.brush
                .on("keyup.myBrush", onKeyUp);

            brushContainer.on("mousemove", mousemove);

            return this;
        }

        function update(indexes) {
            var start = x.pos(indexes[0]);
            var end = x.pos(indexes[1]);
            brushContainer.call(brush.extent([start, end]));
            showEndKnob(end);
            disableBrush();
        };

        function onKeyDown() {
            if (!brushEnabled && d3.event.shiftKey) {
                enableBrush();
            }
        };

        function onKeyUp() {
            disableBrush();
            hideCurrentKnob();
        };

        function mousemove() {
            // TODO: brush move does not work because currentKnob override brush extent.
            // FIXME: inBrush is true if mouse move over brush extent rect.
            // var inBrush = $(d3.event.target).attr("class") == "extent";
            if (!brushStarted) {
                showCurrentKnob();
            }
        };

        function brushstarted() {
            showStartKnob();
            hideCurrentKnob();
            brushStarted = true;
        }

        function brushended() {
            if (!d3.event.sourceEvent) return; // only transition after input
            var extent0 = brush.extent(),
                indexes = extent0.map(x.index),
                extent1 = indexes.map(x.pos);

            d3.select(this).transition()
                .duration(options.transitionTime)
                .call(brush.extent(extent1));

            disableBrush();
            if (indexes[0] != indexes[1]) {
            	onModelChange(indexes);
                brushContainer.call(knobStart.hide());
                brushStarted = false;
            }
        }

        function brushmove() {
            showEndKnob();
        };

        render.withX = function(ax) {
            x = ax;
            return render;
        };

        function enableBrush() {
            brushContainer
                .style("cursor", "crosshair")
                .style("pointer-events", "all");
            brushEnabled = true;
        }

        function disableBrush() {
            brushContainer
                .style("cursor", null)
                .style("pointer-events", "none");
            brushEnabled = false;
        }

        function resetBrush() {
            brushContainer.call(brush.clear());
            disableBrush();
            hideBrushKnob();
        }

        function showStartKnob(pos) {
            var xp = pos || d3.mouse(brushContainer.node())[0];
            var i = x.index(xp);
            var val = x.val(i);
            brushContainer.call(knobStart.translate(xp, 0).show().text(val));
        }

        function showEndKnob(pos) {
            var xp = pos ||d3.mouse(brushContainer.node())[0];
            var i = x.index(xp);
            var val = x.val(i);
            brushContainer.call(knobEnd.translate(xp, 0).show().text(val));
        }

        function hideBrushKnob() {
            brushContainer.call(knobStart.hide());
            brushContainer.call(knobEnd.hide());
        }

        function showCurrentKnob() {
            var xp = d3.mouse(brushContainer.node())[0];
            var i = x.index(xp);
            var val = x.val(i);
            brushContainer.call(knobCurrent.translate(xp, 0).show().text(val));
        };

        function hideCurrentKnob() {
            brushContainer.call(knobCurrent.hide());
        };

        function onModelChange(indexes) {
        	// workaround for correct swap
        	frameIndex = indexes[0]; 
        	model = indexes[1];
        	
        	Dispatcher.trigger("update", indexes[0]);
            Dispatcher.trigger("changeMode", Dispatcher.MODE.HISTORICAL_PATH, indexes[1]);
        }

        function updateBrush() {
            if (mode != Dispatcher.MODE.HISTORICAL_PATH || !model) {
        		model = null;
				resetBrush();
			} else if (model == frameIndex) {
				Dispatcher.trigger("changeMode", Dispatcher.MODE.DEFAULT);
			} else if (model < frameIndex) {
				// swap indexes
				onModelChange([model, frameIndex]);
			} else {
				// frameIndex stores start index, model stores end index,
                update([frameIndex, model]);
			}
        }
        
        Dispatcher.on("changeMode.brush", function(amode, p) {
        	mode = amode;
        	model = p;
        	updateBrush();
		});
        Dispatcher.on("update.brush", function(framePos) {
        	frameIndex = framePos;
        	updateBrush();
        });

        return render;
    }

    return Brush;
});
