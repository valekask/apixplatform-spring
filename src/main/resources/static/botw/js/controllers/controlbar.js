define([
    "d3",
    "dispatcher",
    "views/controlbarview",
    "utils"
],

function(d3, Dispatcher, ControlBarView, Utils) {

	function ControlBarController(opts) {
		
		var options = Utils.extend({}, ControlBarController.defaultOptions, opts),
			container = d3.select(options.container),
			model = {
				paused: true,
				speed: ""
			},
			view = new ControlBarView({
				onPrev: onPrev,
				onNext: onNext,
				onPlayback: onPlayback,
				onPlay: onPlay,
				onPause: pause,
				onPlayText: togglePlay,
				model: model
			}), frameIndex = options.initialFrame, networks, length,
			direction = 1, playTimer,
			speed = 0;
		
		function onPrev() {
			if (model.paused) {
				prevState();
			} else {
				slower();
				slower();
				render();
			}
		}
		
		function onNext() {
			if (model.paused) {
				nextState();
			} else {
				faster();
				faster();
				render();
			}
		}
		
		function onPlayback() {
			if (model.paused) {
				prev();
			} else {
				slower();
				render();
			}
		}
		
		function onPlay() {
			if (model.paused) {
				next();
			} else {
				faster();
				render();
			}
		}

		function slower() {
			if (speed <= options.minSpeed) return;
			speed--;
			updatePlay();
		} 

		function faster() {
			if (speed >= options.maxSpeed) return;
			speed++;
			updatePlay();
		}
		
		function updatePlay() {
			pause();
			play(direction);
		}

		function select(i, continuePlayback) {
			i = i < 0 ? 0 : i >= length ? length - 1 : i;
			continuePlayback || pause();
			if (frameIndex != i) {
				console.log("select " + i);
                Dispatcher.trigger("update", i);
			}
		};

		Dispatcher.on("update.cb", function(framePos) {
			frameIndex = framePos;
        });

		Dispatcher.on("data.cb", function(data) {
			networks = data.microState.networks;
			length = networks.length;
        });

		function prev() {
			if (!length) return;
			select(frameIndex - 1);
		} 

		function next() {
			if (!length) return;
			select(frameIndex + 1);
		}

		function prevState() {
			if (!length) return;
			var state = networks[frameIndex].state;
			for ( var i = frameIndex - 1; i >= 0; i--) {
				if (networks[i].state !== state) {
					select(i);
					break;
				}
			}
		}

		function nextState(loop) {
			if (!length) return;
			if(!selectNextState(frameIndex + 1, loop) && loop) {
				selectNextState(0, loop);
			}
		}
		
		function selectNextState(start, continuePlayback) {
			var state = networks[frameIndex].state;
			for ( var i = start; i < length; i++) {
				if (networks[i].state !== state) {
					select(i, continuePlayback);
					return true;
				}
			}
			return false;
		}
		
		d3.select(document)
			.on("keyup", onKeyUp);

		function onKeyUp() {
			var e = d3.event;
			if ((e.keyCode || e.which) == 37) {
				// left arrow pressed
				if (e.shiftKey) {
					prevState(); 
				} else {
					prev();
				}
			} else if ((e.keyCode || e.which) == 39) {
				// right arrow pressed
				if (e.shiftKey) {
					nextState(); 
				} else {
					next();
				}
			} else if ((e.keyCode || e.which) == 32) {
				// space
				togglePlay();
			}
		};
		
		function play(adirection) {
			direction = adirection;
			if (playTimer || !options.autoplayInterval) return;
			console.log("play");
			playTimer = setInterval(onPlayTimer, options.autoplayInterval / Math.pow(2,speed));
			model.paused = false;
			model.speed = formatSpeed();
			render();
		};
		
		function formatSpeed() {
			return (speed < 0 ? "1/" + Math.pow(2,-speed) : Math.pow(2,speed)) + "x";
		}

        if (options.autoplayEnabled) play(1);    

		function pause() {
			if (playTimer) {
				console.log("pause");
				clearInterval(playTimer);
				playTimer = undefined;
				model.paused = true;
				model.speed = "";
				render();
			}
		};
		
		Dispatcher.on("pause", pause);

		function onPlayTimer() {
			var next = (frameIndex + direction) % length;
			select(next < 0 ? next + length : next, true);
		};
		
		function togglePlay() {
			if (!playTimer) {
				play(direction);
			} else {
				pause();
			}
		};

		function render() {
			container.call(view);
		};
		
		render();
	};

	ControlBarController.defaultOptions = {
		initialFrame: 0,
		autoplayInterval: 2000,
		minSpeed: -3,
		maxSpeed: 3
	};

    return ControlBarController;
})