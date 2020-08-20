define([
    "d3",
    "components/panel/panelproperty",
    "components/panel/panelarrayproperty",
    "components/panel/panelstateproperty",
    "components/panel/paneldistancesproperty",
    "components/panel/panelpathproperty"
],
function(d3, PanelProperty, PanelArrayProperty, PanelStateProperty, 
		PanelDistancesProperty, PanelPathProperty) {

    var NodePanelView = function(options) {

    	var model;
    	
        function render(selection) {
    		if(!model) return;

    		selection.call(PanelStateProperty("State", "state", model.state));
            selection.call(PanelArrayProperty("Description", "description", model.description));
            selection.call(PanelProperty("Group", "group", model.group));
            selection.call(PanelProperty("Periods", "quartersCount", model.quarterCount));
            selection.call(PanelProperty("Probability", "pageRank", model.pagerank));
            selection.call(PanelArrayProperty("Observed at", "quarters", model.quarters));
            selection.call(PanelDistancesProperty("Distances", "distances", model.distances));
            selection.call(PanelPathProperty(model.pathLabel, "path", model.path));
        }

        render.withModel = function(amodel) {
        	model = amodel;
        	return render;
        }

        return render;
    }
    
    return NodePanelView;

});