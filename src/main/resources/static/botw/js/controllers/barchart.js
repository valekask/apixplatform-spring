define([
    "d3",
    "dispatcher",
    "views/barchartview",
    "utils"
],
function(d3, Dispatcher, BarChartView, Utils) {

	function BarChartController(opts) {
		var options = Utils.extend({}, BarChartController.defaultOptions, opts),
		data, dataModel, 
		container = d3.select(options.container), 
		view = new BarChartView({
			//cssClass: options.cssClass,
//			transitionTime: options.transitionTime,
			dimensions: options.dimensions
		}), frameIndex = options.initialFrame;

		function updateModel() {
			dataModel = {
					posDomain: [],
					negDomain: [],
                    posPercent: [],
                    negPercent: [],
					labels: [],
                    group: data.networks[frameIndex].state.group
				}; 
			var categories = data.networks[frameIndex].state.group.categories;
			for ( var key in categories) {
				if (!categories.hasOwnProperty(key)) continue;
				var category = categories[key];
				dataModel.posDomain.push(category.pos);
				dataModel.negDomain.push(-category.neg);
				dataModel.labels.push(category.name);

                var percent = 100 / (category.pos + category.neg);
                dataModel.posPercent.push(percent * category.pos);
                dataModel.negPercent.push(percent * category.neg);
			}
		}
		
		//workaround for Axes 
		function updateScales() {
            var aggregateData = [];
            aggregateData.push({domain: dataModel.posDomain});
            aggregateData.push({domain: dataModel.negDomain});
			view.withAggregateDataModel(aggregateData);
		}
		
		Dispatcher.on("update."+options.cssClass, function(framePos) {
			frameIndex = framePos;
			updateModel();
            updateScales();
			container.call(view.withModel(dataModel));
        });

		Dispatcher.on("data."+options.cssClass, function(adata) {
			data = adata.microState;
			updateModel();
            updateScales();
            container.call(view.withModel(dataModel));
        });

	};
	
	BarChartController.defaultOptions = {
		initialFrame: 0,
    	cssClass: 'barchart'
	};

    return BarChartController;
});
