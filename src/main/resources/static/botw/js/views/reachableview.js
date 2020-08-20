define([
    "utils"
],
function(Utils) {

    var ReachableView = function(opts) {

        var options = Utils.extend({}, ReachableView.defaultOptions, opts), model,
        scale = d3.scale.log().domain([0.1, 100]).range([0, 100]),
        format = d3.format(".1f"),
        stepRange = Range("s", "stepRange", onStepRangeChange, options.stepRangeOptions),
        probRange = Range("p", "probRange", onProbRangeChange, options.probRangeOptions);

        function Range(aLabelText, aCssClass, aOnChange, opts) {
			
			var labelText = aLabelText, cssClass = aCssClass, options = opts, 
			onChange = aOnChange, value, tooltip;
			
			function render(selection) {
				var rangeContainer = selection.selectAll("div."+cssClass + "Container").data([0]);
				
				var rangeContainerEnter = rangeContainer.enter()
					.append("div")
					.attr("class", cssClass + "Container");
				
				rangeContainerEnter.append("span")
					.attr("class", "textLabel")
					.text(labelText);
				
			    var input = rangeContainerEnter.append("input")
	                .attr("type", "range")
	                .attr("step", 1)
	                .attr("min", options.min)
	                .attr("max", options.max)
	                .on("change", onChange)
                    .on("keydown", onKeyDown);
			    rangeContainer.select("input").node().value = value;

	            rangeContainerEnter.append("output")
	            	.attr("class", "rangeTooltip");
	            rangeContainer.select("output")
	            	.text(tooltip || value);
	            
				return this;
			}
			
			render.withValue = function(aValue) {
				value = aValue;
				return render;
			}

            render.withTooltip = function(aTooltip) {
                tooltip = aTooltip;
                return render;
            }

            function onKeyDown() {
                var e = d3.event;
                e.preventDefault();
                return false;
            };
			
			return render;
		}
        
        function render(selection) {
            var container = selection.selectAll("div.reachable").data([0]);
            
            container.enter()
            	.append("div")
                .attr("class", "reachable");
            
            var stepInvert = invertStep(model.step);
            container.call(stepRange.withValue(stepInvert).withTooltip(model.step));

            var logInvert = model.prob > 0 ? Math.round(scale(model.prob)) : 0;
            container.call(probRange.withValue(logInvert).withTooltip(format(model.prob)));

            return this;
        }
        
        function invertStep(value) {
        	return options.stepRangeOptions.max + options.stepRangeOptions.min - value;
        }

        function onStepRangeChange() {
            model.step = invertStep(this.value);
            options.onModelChange();
        }

        function onProbRangeChange() {
            var val = this.value > 0 ? scale.invert(this.value) : 0;
            model.prob = val;
            options.onModelChange();
        }

        render.withModel = function(amodel) {
        	model = amodel;
        	return render;
        }
        
        return render;
    }

    ReachableView.defaultOptions = {
        cssClass: 'reachable',
        onModelChange: new Function()
    }

    return ReachableView;
});