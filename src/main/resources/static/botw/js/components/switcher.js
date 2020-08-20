define([
    "d3",
    "dispatcher",
    "utils"
],
function(d3, Dispatcher, Utils) {

    var Switcher = function(opts) {

        var options = Utils.extend({}, Switcher.defaultOptions, opts);

        function init() {
            var selection = d3.select(options.container);

            var container = selection.selectAll("div."+options.cssClass).data([0])
                .enter().append("div")
                .attr("class", options.cssClass);

            container.selectAll("input").data([0]) // Add input.
                .enter().append("input")
                .attr("type", "checkbox")
                .attr("checked", options.checked ? "checked" : null)
                .attr("class", "input-"+options.cssClass)
                .attr("id", "switcher-"+options.cssClass)
                .on("click", onClick);

            container.selectAll("label").data([0]) // Add label.
                .enter().append("label")
                .attr("for", "switcher-"+options.cssClass)
                .text(options.label);

            container.selectAll("span").data([0]) // Add icon.
                .enter().append("span").attr("class", "icon icon-"+options.cssClass);
        }

        function onClick() {
            Dispatcher.trigger(options.eventName, this.checked);
        }

        init();
    }

    Switcher.defaultOptions = {
        container: "",
        eventName: "",
        cssClass: "switcher",
        transitionTime: 1000,
        checked: 1,
        label: ""
    }

    return Switcher;
});