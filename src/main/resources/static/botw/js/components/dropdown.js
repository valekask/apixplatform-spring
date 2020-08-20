define([
    "utils"
],
function(Utils) {

    var DropDown = function(opts) {

        var options = Utils.extend({}, DropDown.defaultOptions, opts), 
        index = {}, model = options.model;
        
        function render(selection) {
            var container = selection.selectAll("div."+options.cssClass).data([0]);
            container.enter()
            	.append("div")
                .classed(options.cssClass, true)
                .classed("dropdown", true);

            var selectContainer = container.selectAll("select").data([0]);
            selectContainer.enter().append("select")
            	.on("change", onChange)
                .each(function(d) {
                	model.options.forEach(function(d, i) {
                		index[d.value] = i;
                	});
    			});

            selectContainer.selectAll("option").data(model.options)
                .enter().append("option")
                .attr("value", function(d) {return d.value;})
                .text(function(d) {return d.label;});
            
            container.selectAll("label").data([0])
        		.enter().insert("label", options.labelPosition == "left" ? "select" : undefined)
        		.text(options.label);
    
            selectContainer.node().selectedIndex = index[model.value];
        }

        function onChange() {
            var selectedIndex = this.selectedIndex;
            model.value = model.options[selectedIndex].value;
            options.onChange();
        }
        
        return render;
    }

    DropDown.defaultOptions = {
        cssClass: "dropdown",
        transitionTime: 1000,
        label: '',
        labelPosition: "left",
        onChange: new Function()
    }

    return DropDown;
});