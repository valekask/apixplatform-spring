define([
    "d3",
    "utils",
    "dispatcher"
],
function(d3, Utils, Dispatcher) {

    var Button = function(opts) {

        var options = Utils.extend({}, Button.defaultOptions, opts);

        function init() {
            var selection = d3.select(options.container);

            var container = selection.selectAll("div."+options.cssClass).data([0])
                .enter().append("div")
                .classed(options.cssClass, true)
                .classed("button", true);

            var button = container.selectAll("button").data([0])
                .enter().append("button")
                .attr("type", "button")
                .classed("btn", true)
                .classed("btn-default", true)
                .on("click", onClick)
                .text(options.label);
        };

        function onClick() {
            Dispatcher.trigger(options.eventName);
        };

        init();
    }

        Button.defaultOptions = {
        container: "",
        eventName: "",
        cssClass: "button",
        transitionTime: 1000,
        checked: 1,
        label: ""
    }

    return Button;
});