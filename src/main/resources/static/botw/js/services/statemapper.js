define([],
function() {

	function StateMapper(opts) {
		var module = {},
		tokens = {
	        	'G': "GDP",
	        	'I': "Inflation",
	        	'O': "Oil",
	        	'D': "DPI",
//	        	'U': "Unemployment",
	        	'U': "UE",
	        	'E': "NE",
//	        	'P': "Prime Rate",
	        	'P': "Prime",
	        	'X': "Exchange Rate",
	        	'H': "Housing",
//	        	'S': "S&P 500"
	        	'S': "SP500"
	    }, emptyToken = '_',
	    arrows = {up: "&uarr;", down: "&darr;"};
		
		module.parseLink = function(alabel, blabel) {
			var res = [];
			for ( var key in tokens) {
				if (!tokens.hasOwnProperty(key)) continue;
				var a = alabel.indexOf(key) != -1, b = blabel.indexOf(key) != -1;
				if (!a && b) {
					res.push(tokens[key] + ' ' + arrows.up);
				} else if (a && !b) {
					res.push(tokens[key] + ' ' + arrows.down);
				}
			}
			return res;
		};
		
		module.parseNode = function(alabel) {
			var res = [], a = alabel.split('');
			for ( var i = 0; i < a.length; i++) {
				if (tokens[a[i]]) {
					res.push(tokens[a[i]] + ' ' + arrows.up);
				}
			}
			return res;
		};
		
		module.keys = function() {
			var res = [];
			for (var key in tokens) {
				res.push(key);
			}
			return res;
		};
		
		module.get = function(key) {
			return tokens[key];
		};

		module.values = function() {
			return module.keys().map(module.get);
		};
		
		return module;
	};
    return StateMapper;
});
