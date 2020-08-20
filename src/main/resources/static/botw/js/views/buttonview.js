define([
    "utils"
],
function(Utils) {

    ButtonView = function(opts) {

        var options = Utils.extend({}, ButtonView.defaultOptions, opts); 
        
        function render(selection) {
            var container = selection.selectAll("div."+options.cssClass).data([0]);
            container.enter()
            	.append("div")
                .classed(options.cssClass, true);

            container.selectAll("span").data([0])
        		.enter().append("span")
        		.text(options.label)
        		.on("click", options.onClick);
        }

        return render;
    }
 
    ButtonView.defaultOptions = {
    	cssClass: "button"
    }

    return ButtonView;
});