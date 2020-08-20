require([
    "jquery",
    "d3",
    "options",
    "utils",
    "services/dataprovider",
    "services/statemapper",
    "controllers/microstate",
    "controllers/macrostate",
    "controllers/panel",
    "controllers/barchart",
    "controllers/controlbar",
    "controllers/reachable",
    "controllers/tailsteps",
    "controllers/scatterplot",
    "modules/transportbar",
    "components/dialog",
    "components/switcher",
    "components/button",
    "d3-transform"
], function($, d3, opts, Utils, DataProvider, StateMapper, MicroStateController, MacroStateController, Panel,
            BarChartController, ControlBarController, ReachableController, TailStepsController, ScatterPlotController, 
            TransportBar, Dialog, Switcher, Button) {

    var microStates     = $(".microstateContainer");
    var macroStates     = $(".macrostateContainer");
    var barChart        = $(".barChartContainer");
    var transportBar    = $(".transportBarContainer");
    var footer          = $(".footer");
    var defaultOptions = {
        modal: {
            groups: [
                1, 2, 3, 4, 5, 6
            ]
        },
        scatterPlot: {
        	"transition_duration":1000,
        	"key_x": "GDP",
        	"key_y": "Unemp",
        	"color":{"mapping":"color"},
        	"scope":"NETWORK",
        	"containerClass":"scatterPlotContainer",
        	"initialFrame":0
        },
        boxPlot: {
        	"key_x": "GDP",
            "key_y": "Unemp",
        	"containerClass":"scatterPlotContainer"
        }
    };

    var options = Utils.extend({}, defaultOptions, opts); // if config exist only in defaultOptions
    // the update config properties
    options.scatterPlot = Utils.extend({}, defaultOptions.scatterPlot, opts.scatterPlot);
    options.boxPlot = Utils.extend({}, defaultOptions.boxPlot, opts.boxPlot);

	var stateMapper = new StateMapper();

    new MicroStateController({
    	container: d3.select(".microstateContainer").node(),
    	dimensions: {
            width: microStates.width(),
            height: microStates.height()
        }
    });
    new MacroStateController({
    	container: d3.select(".macrostateContainer").node(),
    	dimensions: {
            width: macroStates.width(),
            height: macroStates.height()
        }
    });

    new ScatterPlotController({
    	container: d3.select(".scatterplotContainer").node()
    });

    new TransportBar({
        container: d3.select(".transportBarContainer").node(),
        dimensions: {
            width: transportBar.width(),
            height: footer.height()
        },
        axes: {
            x: { scale: "ordinal" },
            y: { scale: "ordinal" }
        },
        series: [
        {
            type: "bar",
            source: "net_id"
        }],
        seriesValueLabelsEnabled: false,
        highlight: {
            height: 15
        }
    });

    new BarChartController({
    	container: d3.select(".barChartContainer").node(),
    	dimensions: {
            width: barChart.width(),
            height: barChart.height()
        }
    });
    
    new ControlBarController({
    	container: d3.select(".controlBarContainer").node(),
    });

    new Panel({
    	container: d3.select(".panelContainer").node(),
    	stateMapper: stateMapper
    });

    new Dialog({
        cssClass: "groupDialog"
    });

    new ReachableController({
        container: d3.select(".reachableContainer").node()
    });

    new Switcher({
        container: d3.select(".buttonContainer").node(),
        eventName: "changeSelfLinksEnabled",
        cssClass: "switcherSl",
        checked: 0,
        label: "Show self-loops"
    });

    new Switcher({
        container: d3.select(".buttonContainer").node(),
        eventName: "changeNodesLabelsEnabled",
        cssClass: "switcherNodesLabels",
        checked: 1,
        label: "Show nodes labels"
    });

    new TailStepsController({
        container: d3.select(".buttonContainer").node()
    });

    new Button({
        container: d3.select(".buttonContainer").node(),
        eventName: "centerNode",
        cssClass: "nodeReposition",
        label: ""
    });

    new DataProvider(options.dataProvider);
    
    console.log("started");

});