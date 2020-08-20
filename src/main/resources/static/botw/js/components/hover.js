define([
	"components/callout",
	"utils"
],
function(Callout, Utils) {

	function Hover(opts) {
  	  
		var options = Utils.extend({}, Hover.defaultOptions, opts),
  	  	transition = options.transitionTime, x, y, t, animatePos = false, skipTransition = true,
  	  	opacity = 0.000001, callout = Callout(options.cssClass);
  	  
  	  	var render = function(selection) {
  	  		var g = selection.selectAll("g.hover."+opts.cssClass).data([0]);
  	  		g.enter().append("g").attr("class", "hover "+opts.cssClass);
  	  		var t = g.transition();
  	  		if (opacity != 1) {
  	  			t.delay(transition).duration(transition)
  	  				.style("opacity", opacity)
  	  				.each("end", function() {
  	  					d3.select(this).style("display", "none");
  	  				});
  	  		} else {
  	  			t.duration(skipTransition ? 0 : transition);
  	  	  		var transform = d3.svg.transform().translate(x, y);
  	  	  		if (animatePos) {
  	  	  			t.attr("transform", transform);
  	  	  		} else {
  	  	  			g.attr("transform", transform);
  	  	  		}
  	  	  		g.call(callout);
  	  			t.style("display", null)
	  				.style("opacity", opacity);
  	  		}
  	  		skipTransition = false;
  	  	}
  	  
        render.skipTransition = function() {
        	skipTransition = true;
        	return render;
        }

  	  	render.show = function(ax, ay, at) {
  	  		animatePos = t == at;
  	  		x = ax;
  	  		y = ay;
  	  		t = at;
  	  		callout.text(t);
  	  		opacity = 1;
  	  		return render;
  	  	}

  	  	render.hide = function() {
  	  		opacity = 0.000001;
  	  		return render;
  	  	}

  	  	return render;
    }
	
	Hover.defaultOptions = {
	    transitionTime: 1000
	}

    return Hover;
});