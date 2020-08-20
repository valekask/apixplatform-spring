define([
    "utils"
],

function(Utils) {

	function ControlBarView(opts) {
		
		var options = Utils.extend({}, ControlBarView.defaultOptions, opts),
		model = options.model;

		function Button(aCallback, aCssClass) {
			
			var callback = aCallback, cssClass = aCssClass; 
			
			function render(selection) {
				if (callback) {
					selection
						.append("div")
						.attr("class", cssClass + " arrow")
						.on("click", callback);
				}
				return this;
			}
			
			return render;
		}
		
		function PlayButtonView(aCallback, aText, aModel) {
			
			var callback = aCallback, text = aText, model = aModel; 
			
			function render(selection) {
				if (callback) {
					var div = selection.selectAll("div.text-button").data([0]);
					div.enter()
						.append("div")
						.attr("class", "text-button")
						.on("click", callback)
						.append("span")
						.text(text);
					div.classed("play", model.paused);
					div.classed("pause", !model.paused);
				}

				return this;
			}
			
			return render;
		}
		
		function render(selection) {

			var d = selection.selectAll("div.controlBar").data([0]);
			var dEnter = d.enter()
                .append("div")
                .attr("class", "controlBar");
			
			dEnter.call(Button(options.onPrev, "frewind"));
			dEnter.call(Button(options.onPlayback, "prev"));
			d.call(PlayButtonView(options.onPlayText, "PLAY", model));
			dEnter.call(Button(options.onPlay, "next"));
			dEnter.call(Button(options.onNext, "fforward"));
			dEnter
				.append("div")
				.attr("class", "speed-label")
				.append("span");
			
			d.select(".speed-label span").attr("d", model.speed).html(model.speed);

			return this;
		};

		return render;
	};

	ControlBarView.defaultOptions = {
		onPrev: null,
	    onNext: null,
	    onPlay: null,
	    onPlayback: null,
	    onPlayText: null,
    }

    return ControlBarView;
})