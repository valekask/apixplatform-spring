define([
    "d3",
    "dispatcher",
    "utils",
    "bootstrap"
],
    function(d3, Dispatcher, Utils) {

        var Dialog = function(opts) {

            var options = Utils.extend({}, Dialog.defaultOptions, opts),
                node, groupsMap, groupsModel, modal, dialogContent;

            function init() {

                var container = d3.select("body").selectAll("div.dialog."+options.cssClass).data([0])
                    .enter().append("div")
                    .attr("class", "dialog fade "+options.cssClass);

                var dialogContainer = container.selectAll("div.modal-dialog").data([0])
                    .enter().append("div")
                    .attr("class", "modal-dialog");

                dialogContent = dialogContainer.selectAll("div.modal-content").data([0])
                    .enter().append("div")
                    .attr("class", "modal-content");

                dialogContent.selectAll("button.close").data([0])
                    .enter().append("button")
                    .attr("class", "close")
                    .attr("type", "button")
                    .attr("data-dismiss", "modal")
                    .html("&times;");

                var dialogBody = dialogContent.selectAll("div.modal-body").data([0])
                    .enter().append("div")
                    .attr("class", "modal-body");

                dialogBody.selectAll("div.form-group").data([0])
                    .enter().append("div")
                    .attr("class", "form-group");

                var dialogFooter = dialogContent.selectAll("div.modal-footer").data([0])
                    .enter().append("div")
                    .attr("class", "modal-footer");

                dialogFooter.selectAll("button.btn-default").data([0])
                    .enter().append("button")
                    .attr("class", "btn-default")
                    .classed("btn", true)
                    .attr("data-dismiss", "modal")
                    .text("Close");

                dialogFooter.selectAll("button.doSave").data([0])
                    .enter().append("button")
                    .attr("class", "doSave")
                    .classed("btn", true)
                    .classed("btn-primary", true)
                    .attr("data-dismiss", "modal")
                    .text("Save")
                    .on("click", function(d) {
                        onSave();
                    });

                modal = $("."+options.cssClass);
                modal.modal({show: false}); // Init modal dialog.
            }
            
            var updateModel = function() {
                groupsModel = [], distanceMap = node.distances;
                for (var groupId in groupsMap) {
                    if (!groupsMap.hasOwnProperty(groupId)) continue;
                    groupsModel.push({ 
                    	id: groupId,
                    	cssClass: groupsMap[groupId].cssClass,
                    	distance: distanceMap[groupId] ? distanceMap[groupId].value : null });
                }
            }

            var render = function() {

            	var radio = dialogContent.select(".form-group")
                	.selectAll("div.radio").data(groupsModel, function (d) {return d.id;});
                var radioEnter = radio
                    .enter().append("div") // Create div wrapper.
                    .attr("class", function (d) { return "radio group" + d.id; })
                    .on("click", function(d) {
                        onSelect(d.id);
                    });

                radioEnter
                    .append("span").classed("groupDesc", true)
                    .append("label")
                    .text(function(d, i) { return "Group " + d.id; });

                radioEnter
                	.append("span").classed("groupDist", true)
                	.append("label")
                	;

                radioEnter.append("div") // group icon
                    .attr("class", function (d) { return "groupIcon " + d.cssClass; });
                
                radio.select("span.groupDist label").text(function(d, i) { return d.distance ? d.distance.toFixed(0) : '-';})
            }

            var show = function(selectedGroup) {
            	render();
                d3.selectAll(".radio").classed("selectedGroup", false); // hide all previous selected
                d3.select(".group"+selectedGroup).classed("selectedGroup", true);
                modal.modal("show");
            }

            var hide = function(selectedGroup) {
                modal.modal("hide");
                Dispatcher.trigger("changeGroup", node, groupsMap[selectedGroup.id]);
            }

            function onSave() {
                var selectedGroup = d3.select(".radio.selectedGroup").data()[0];
                hide(selectedGroup);
            }

            function onSelect(selectedGroup) {
                d3.selectAll(".radio").classed("selectedGroup", false); // hide all previous selected
                d3.selectAll(".radio.group"+selectedGroup).classed("selectedGroup", true);
            }

            Dispatcher.on("showDialog.modal", function(anode) {
                node = anode;
                updateModel();
                show(node.group.id);
            });

            Dispatcher.on("data.modal", function(adata) {
                groupsMap = adata.microState.groups;
            });

            init();
        }

        Dialog.defaultOptions = {
            cssClass: "dialog"
        };

        return Dialog;
    });