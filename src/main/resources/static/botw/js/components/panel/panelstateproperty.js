define([
],
function() {

	function PanelStateProperty(aLabel, aCssClass, aValue) {
		
		var label = aLabel, cssClass = aCssClass, value = aValue; 
		
		function render(selection) {
			 var property = selection.selectAll("div."+cssClass).data([value]);
	         var propertyEnter = property.enter()
	           	.append("div")
	           	.attr("class", "property "+cssClass);
	       	var group = propertyEnter.append("div").attr("class", "colored");;
	       	group.append("span").attr("class", "coloredValue");
	       	group.append("span").attr("class", "coloredLabel");
	       	group.append("div").attr("class", "coloredIcon");
	       		
	       	property.select("span.coloredLabel").html(label);
	       	property.select("span.coloredValue").html(value.label);
	       	property.select("div.coloredIcon").attr("class", "coloredIcon " + value.cssClass);
			return this;
		}
		
		return render;
	}

    return PanelStateProperty;
});