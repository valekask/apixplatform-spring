define([
    "d3",
    "dispatcher",
    "utils",
    "components/axes",
    "components/serie"
],
function(d3, Dispatcher, Utils, Axes, Serie) {

    function BarChartView(opts) {
		var options = Utils.extend({}, BarChartView.defaultOptions, opts),
        firstLoad = true, 
        outer = options.dimensions,
        paddings = options.paddings,
        dimensions = {
            width : outer.width - paddings.left - paddings.right,
            height : outer.height - paddings.top - paddings.bottom
        }, model, aggregateModel;

        var render = function(selection) {
        	
        	if (!model) return;
        	
            var transitionDuration = firstLoad ? 0 : options.transitionDuration;

            if (firstLoad) firstLoad = false;

            var svg = selection.selectAll("svg").data([0]);
            svg.enter()
                .append("svg") // Add svg to container.
                .attr("width", outer.width)
                .attr("height", outer.height);

            var barChartGroups = svg.selectAll("g.barChartGroups").data([0]);
            barChartGroups.enter()
                .append("g")
                .attr("class", "barChartGroups")
                .attr("transform", d3.svg.transform().translate(paddings.left, paddings.top));

            var labelTexts = model.labels;

            // Create series.
            var seriePositive = new Serie({
                index: "1",
                width: dimensions.width,
                transitionDuration: transitionDuration,
                barCssClassGetter: function() { return model.group.cssClass; }
            }, model.posDomain);

            var serieNegative = new Serie({
                index: "2",
                width: dimensions.width,
                transitionDuration: transitionDuration,
                barCssClassGetter: function() { return model.group.cssClass; }
            }, model.negDomain);
            
            // Create axes.
            var yAxis = Axes.YAxis({
                scale: options.axes.y.scale,
                height: dimensions.height,
                tickFormat: d3.format(options.tickFormat),
                transitionDuration: 0
            }, aggregateModel);

            var xAxis = Axes.XAxis({
                scale: options.axes.x.scale,
                width:  dimensions.width,
                height: dimensions.height,
                renderTicks: false,
                transitionDuration: 0,
                x: 0,
                y: yAxis.scale(0)
            }, aggregateModel[0].domain);

            var ss = function(d, i) {
                return model[i].cssClass;}
            
            // Render series
            var seriePositiveRender = seriePositive.withXAxis(xAxis).withYAxis(yAxis).withLabels(labelTexts).withPercents(model.posPercent, "top", "posPercent");
            var serieNegativeRender = serieNegative.withXAxis(xAxis).withYAxis(yAxis).withPercents(model.negPercent, "bottom", "negPercent");

            barChartGroups
                .call(xAxis) // Render and append axes.
                .call(yAxis)
                .call(seriePositiveRender)  // Append series.
                .call(serieNegativeRender);
        }
        
        render.withModel = function(amodel) {
        	model = amodel;
        	return render; 
        }
        
        render.withAggregateDataModel = function(anAggregateModel) {
        	aggregateModel = anAggregateModel;
        	return render; 
        }

        return render;
    }

    BarChartView.defaultOptions = {
        transitionDuration: 1000,
        axes: {
            x: { scale: "ordinal" },
            y: { scale: "linear" }
        },
        paddings: {
            top : 42,
            right : 15,
            bottom : 20,
            left : 35
        }
    }

    return BarChartView;
})