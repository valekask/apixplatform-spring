define([
    "components/panel/panelproperty"
],
function(PanelProperty) {

	function PanelArrayPropertyHeader(aLabel, aCssClass) {
		return PanelProperty(aLabel, aCssClass, '');
	}

    return PanelArrayPropertyHeader;
});