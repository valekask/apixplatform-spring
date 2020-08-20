define([
    "d3",
    "dispatcher",
    "views/reachableview",
    "utils"
],
function(d3, Dispatcher, ReachableView, Utils) {

    var ReachableController = function(opts) {

        var options = Utils.extend({onModelChange: onModelChange}, ReachableController.defaultOptions, opts),
           	container = d3.select(options.container),
            stepRange, probRange,
            model, view = ReachableView(options);
        
        function init() {
        	resetToDefault();
            render();
        }
        
        function resetToDefault() {
        	model = {
        		step: options.stepRangeOptions.default, 
        		prob: options.probRangeOptions.default};
        }
        
        function onModelChange() {
        	if (model.prob && model.step) {
        		Dispatcher.trigger("changeMode", Dispatcher.MODE.REACHABLE, model);
        	} else {
        		Dispatcher.trigger("changeMode", Dispatcher.MODE.DEFAULT);
        	}
        }
        
        function render() {
        	container.call(view.withModel(model));
        }
        
        Dispatcher.on("changeMode.reachable", function(amode, p) {
			if (amode != Dispatcher.MODE.REACHABLE) {
				resetToDefault();
			} else {
				model = p;
			}
            render();
		});

        init();
    }

    ReachableController.defaultOptions = {
    	stepRangeOptions: {
    	    min: 1,
    	    max: 36,
    	    default: 36
    	},
    	probRangeOptions: {
    	    min: 0,
    	    max: 100,
    	    default: 0
    	}
    }

    return ReachableController;
});