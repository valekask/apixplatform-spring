define([
],
function() {

	function PanelProperty(aLabel, aCssClass, aValue) {
		
		var label = aLabel, cssClass = aCssClass, value = aValue; 
		
		function render(selection) {
			var property = selection.selectAll("div."+cssClass).data([0]);
            property.enter()
            	.append("div")
            	.attr("class", "property "+cssClass);
            property.html(label + ": " + value);
			return this;
		}
		
		return render;
	}

    return PanelProperty;
});