define([
    "d3",
    "components/panel/panelarraypropertyheader"
],
function(d3, PanelArrayPropertyHeader) {

	function PanelDistancesProperty(aLabel, aCssClass, aValues) {
		
		var header = PanelArrayPropertyHeader(aLabel, aCssClass),
		cssClass = aCssClass, values = aValues; 
		
		function render(selection) {
			selection.call(header);
        	var property = selection.select("div."+cssClass);
            var subproperty = property.selectAll("div.subproperty").data(values);
            subproperty.enter()
            	.append("div")
            	.attr("class", "subproperty")
            	.each(function(d) {
            		var self = d3.select(this);
            		var group = self.append("div").attr("class", "colored");
            		group.append("span").attr("class", "coloredValue");
            		group.append("div").attr("class", "coloredIcon");
            	});
            subproperty.exit().remove();
            subproperty.each(function(d) {
        		var self = d3.select(this);
        		self.select("span.coloredValue").html("Group " + d.label + ": " + (d.value ? d.value.toFixed(0) : '-'));
        		self.select("div.coloredIcon").attr("class", "coloredIcon " + d.cssClass);
        	});
			return this;
		}
		
		return render;
	}

    return PanelDistancesProperty;
});