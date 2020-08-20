define([
    "d3",
    "dispatcher",
    "components/dropdown",
    "utils"
],
function(d3, Dispatcher, DropDown, Utils) {

    var TailStepsController = function(opts) {

        var options = Utils.extend({}, TailStepsController.defaultOptions, opts),
           	container = d3.select(options.container),
            model = {
        		options: [
     			    { label: "No", value: 0 },
     			    { label: "1", value: 1 },
     			    { label: "2", value: 2 },
     			    { label: "3", value: 3 },
     			    { label: "4", value: 4 },
     			    { label: "5", value: 5 },
     			    { label: "6", value: 6 },
     			    { label: "7", value: 7 },
     			    { label: "8", value: 8 },
     			    { label: "9", value: 9 },
     			    { label: "10", value: 10 }
     			],
        		value: undefined
        	},
            view = new DropDown({
    			cssClass: "tailStep",
    			label: "Tail Nodes",
    			labelPosition: "right",
                model: model,
    			onChange: onModelChange
    		});
        
        function init() {
        	resetToDefault();
            render();
        }
        
        function resetToDefault() {
        	model.value = options.initialValue;
        }
        
        function onModelChange() {
            Dispatcher.trigger("changeMode", Dispatcher.MODE.TAIL, model.value);
        }
        
        function render() {
        	container.call(view);
        }
        
        Dispatcher.on("changeMode.tail", function(amode, p) {
			if (amode != Dispatcher.MODE.TAIL) {
				resetToDefault();
			} else {
				model.value = p;
			}
            render();
		});

        init();
    }

    TailStepsController.defaultOptions = {
    	initialValue: 0
    }

    return TailStepsController;
});