d3.behavior.zoom = function() {
    var view = {
        x: 0,
        y: 0,
        k: 1
    }, translate0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, d3.dispatch("zoomstart", "zoom", "zoomend")), x0, x1, y0, y1;
    function zoom(g) {
        g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on(mousemove, mousewheelreset).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
        g.each(function() {
            var event_ = event.of(this, arguments), view1 = view;
            if (d3_transitionInheritId) {
                d3.select(this).transition().each("start.zoom", function() {
                    view = this.__chart__ || {
                        x: 0,
                        y: 0,
                        k: 1
                    };
                    zoomstarted(event_);
                }).tween("zoom:zoom", function() {
                        var dx = size[0], dy = size[1], cx = dx / 2, cy = dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
                        return function(t) {
                            var l = i(t), k = dx / l[2];
                            this.__chart__ = view = {
                                x: cx - l[0] * k,
                                y: cy - l[1] * k,
                                k: k
                            };
                            zoomed(event_);
                        };
                    }).each("end.zoom", function() {
                        zoomended(event_);
                    });
            } else {
                this.__chart__ = view;
                zoomstarted(event_);
                zoomed(event_);
                zoomended(event_);
            }
        });
    };
    zoom.translate = function(_) {
        if (!arguments.length) return [ view.x, view.y ];
        view = {
            x: +_[0],
            y: +_[1],
            k: view.k
        };
        rescale();
        return zoom;
    };
    zoom.scale = function(_) {
        if (!arguments.length) return view.k;
        view = {
            x: view.x,
            y: view.y,
            k: +_
        };
        rescale();
        return zoom;
    };
    zoom.scaleExtent = function(_) {
        if (!arguments.length) return scaleExtent;
        scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
        return zoom;
    };
    zoom.center = function(_) {
        if (!arguments.length) return center;
        center = _ && [ +_[0], +_[1] ];
        return zoom;
    };
    zoom.size = function(_) {
        if (!arguments.length) return size;
        size = _ && [ +_[0], +_[1] ];
        return zoom;
    };
    zoom.x = function(z) {
        if (!arguments.length) return x1;
        x1 = z;
        x0 = z.copy();
        view = {
            x: 0,
            y: 0,
            k: 1
        };
        return zoom;
    };
    zoom.y = function(z) {
        if (!arguments.length) return y1;
        y1 = z;
        y0 = z.copy();
        view = {
            x: 0,
            y: 0,
            k: 1
        };
        return zoom;
    };
    function location(p) {
        return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
        return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
        view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
        l = point(l);
        view.x += p[0] - l[0];
        view.y += p[1] - l[1];
    }
    function rescale() {
        if (x1) x1.domain(x0.range().map(function(x) {
            return (x - view.x) / view.k;
        }).map(x0.invert));
        if (y1) y1.domain(y0.range().map(function(y) {
            return (y - view.y) / view.k;
        }).map(y0.invert));
    }
    function zoomstarted(event) {
        event({
            type: "zoomstart"
        });
    }
    function zoomed(event) {
        rescale();
        event({
            type: "zoom",
            scale: view.k,
            translate: [ view.x, view.y ]
        });
    }
    function zoomended(event) {
        event({
            type: "zoomend"
        });
    }
    function mousedowned() {
        var target = this, event_ = event.of(target, arguments), eventTarget = d3.event.target, dragged = 0, w = d3.select(window).on(mousemove, moved).on(mouseup, ended), l = location(d3.mouse(target)), dragRestore = d3_event_dragSuppress();
        d3_selection_interrupt.call(target);
        zoomstarted(event_);
        function moved() {
            dragged = 1;
            translateTo(d3.mouse(target), l);
            zoomed(event_);
        }
        function ended() {
            w.on(mousemove, window === target ? mousewheelreset : null).on(mouseup, null);
            dragRestore(dragged && d3.event.target === eventTarget);
            zoomended(event_);
        }
    }
    function touchstarted() {
        var target = this, event_ = event.of(target, arguments), locations0 = {}, distance0 = 0, scale0, eventId = d3.event.changedTouches[0].identifier, touchmove = "touchmove.zoom-" + eventId, touchend = "touchend.zoom-" + eventId, w = d3.select(window).on(touchmove, moved).on(touchend, ended), t = d3.select(target).on(mousedown, null).on(touchstart, started), dragRestore = d3_event_dragSuppress();
        d3_selection_interrupt.call(target);
        started();
        zoomstarted(event_);
        function relocate() {
            var touches = d3.touches(target);
            scale0 = view.k;
            touches.forEach(function(t) {
                if (t.identifier in locations0) locations0[t.identifier] = location(t);
            });
            return touches;
        }
        function started() {
            var changed = d3.event.changedTouches;
            for (var i = 0, n = changed.length; i < n; ++i) {
                locations0[changed[i].identifier] = null;
            }
            var touches = relocate(), now = Date.now();
            if (touches.length === 1) {
                if (now - touchtime < 500) {
                    var p = touches[0], l = locations0[p.identifier];
                    scaleTo(view.k * 2);
                    translateTo(p, l);
                    d3_eventPreventDefault();
                    zoomed(event_);
                }
                touchtime = now;
            } else if (touches.length > 1) {
                var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
                distance0 = dx * dx + dy * dy;
            }
        }
        function moved() {
            var touches = d3.touches(target), p0, l0, p1, l1;
            for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
                p1 = touches[i];
                if (l1 = locations0[p1.identifier]) {
                    if (l0) break;
                    p0 = p1, l0 = l1;
                }
            }
            if (l1) {
                var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
                p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
                l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
                scaleTo(scale1 * scale0);
            }
            touchtime = null;
            translateTo(p0, l0);
            zoomed(event_);
        }
        function ended() {
            if (d3.event.touches.length) {
                var changed = d3.event.changedTouches;
                for (var i = 0, n = changed.length; i < n; ++i) {
                    delete locations0[changed[i].identifier];
                }
                for (var identifier in locations0) {
                    return void relocate();
                }
            }
            w.on(touchmove, null).on(touchend, null);
            t.on(mousedown, mousedowned).on(touchstart, touchstarted);
            dragRestore();
            zoomended(event_);
        }
    }
    function mousewheeled() {
        var event_ = event.of(this, arguments);
        if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this),
            zoomstarted(event_);
        mousewheelTimer = setTimeout(function() {
            mousewheelTimer = null;
            zoomended(event_);
        }, 50);
        d3_eventPreventDefault();
        var point = center || d3.mouse(this);
        if (!translate0) translate0 = location(point);
        scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
        translateTo(point, translate0);
        zoomed(event_);
    }
    function mousewheelreset() {
        translate0 = null;
    }
    function dblclicked() {
        var event_ = event.of(this, arguments), p = d3.mouse(this), l = location(p), k = Math.log(view.k) / Math.LN2;
        zoomstarted(event_);
        scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
        translateTo(p, l);
        zoomed(event_);
        zoomended(event_);
    }
    return d3.rebind(zoom, event, "on");
};



var d3_behavior_zoomInfinity = [ 0, Infinity ];
var d3_behavior_zoomDelta, d3_behavior_zoomWheel = "onwheel" in document ? (d3_behavior_zoomDelta = function() {
    return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
}, "wheel") : "onmousewheel" in document ? (d3_behavior_zoomDelta = function() {
    return d3.event.wheelDelta;
}, "mousewheel") : (d3_behavior_zoomDelta = function() {
    return -d3.event.detail;
}, "MozMousePixelScroll");

function d3_eventDispatch(target, adispatch) {

    var dispatch = adispatch;

    dispatch.of = function(thiz, argumentz) {
        return function(e1) {
            try {
                var e0 = e1.sourceEvent = d3.event;
                e1.target = target;
                d3.event = e1;
                dispatch[e1.type].apply(thiz, argumentz);
            } finally {
                d3.event = e0;
            }
        };
    };

    return dispatch;
}

function d3_selection_interrupt() {
    var lock = this.__transition__;
    if (lock) ++lock.active;
}

/**
 * Override function that make drag slow.
 * @return {Function} empty function.
 */
function d3_event_dragSuppress() {
    return function() {

    };
};
function d3_eventPreventDefault() {
    d3.event.preventDefault();
}