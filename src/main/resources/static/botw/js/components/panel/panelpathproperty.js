define([
    "d3"
],
function(d3) {

	function PanelPathProperty(aLabel, aCssClass, aValues) {
		
		var label = aLabel, cssClass = aCssClass, values = aValues; 
		
		function render(selection) {
			var property = selection.selectAll("div."+cssClass).data(values.length ? [0] : []);
            property.enter()
            	.append("div")
            	.attr("class", "property "+cssClass)
            	.attr("id", cssClass);
            property.html(label + ": ");
            property.exit().remove();
            
            var subproperty = property.selectAll("div.subproperty").data(values);
            subproperty.enter()
            	.append("div")
            	.attr("class", "subproperty")
            	.each(function(d) {
            		var self = d3.select(this);
            		var l = self.append("div").attr("class", "path-header");
            		l.append("span").attr("class", "path-index");
            		l.append("span").attr("class", "path-label");
            		self.append("div").attr("class", "path-states");
            	});
            subproperty.exit().remove();
            subproperty.each(function(d, i) {
        		var self = d3.select(this);
        		self.select("span.path-index").html((d.index || (i + 1)) + ')');
        		self.select("span.path-label").html(' ' + d.label|| '');
        		var states = self.selectAll("div.states").data(function(d) {return d.indexes;});
        		states.enter()
        			.append("div")
        			.attr("class", "path-states");
        		states.exit().remove();
        		states.html(function(d) {return d;});
        	});
			return this;
		}
		
		return render;
	}

    return PanelPathProperty;
});