define([
    "components/panel/panelarraypropertyheader"
],
function(PanelArrayPropertyHeader) {

	function PanelArrayProperty(aLabel, aCssClass, aValues) {
		
		var header = PanelArrayPropertyHeader(aLabel, aCssClass),
		cssClass = aCssClass, values = aValues; 
		
		function render(selection) {
			selection.call(header);
			var property = selection.select("div."+cssClass);
			
			var subproperty = property.selectAll("div.subproperty").data(values);
            subproperty.enter()
            	.append("div")
            	.attr("class", "subproperty");
            subproperty.html(function(d) {return d;});
            subproperty.exit().remove();
			return this;
		}
		
		return render;
	}

    return PanelArrayProperty;
});