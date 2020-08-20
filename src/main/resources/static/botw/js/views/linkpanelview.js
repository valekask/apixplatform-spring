define([
    "d3",
    "components/panel/panelproperty",
    "components/panel/panelarrayproperty",
    "components/panel/panelstateproperty"
],
function(d3, PanelProperty, PanelArrayProperty, PanelStateProperty) {

    var LinkPanelView = function(options) {

        var model;

        function render(selection) {

            if(!model) return;
            
            selection.call(PanelStateProperty("From State", "fromState", model.from));
            selection.call(PanelStateProperty("To State", "toState", model.to));
            selection.call(PanelProperty("Transitions", "transitions", model.transition_count));
            selection.call(PanelArrayProperty("Transition List", "transitionsList", model.transition_list));
            selection.call(PanelProperty("Transition Probability", "transitionsProbability", model.transition_prob));
        };

        render.withModel = function(amodel) {
            model = amodel;
            return render;
        }

        return render;
    }

    return LinkPanelView;

});