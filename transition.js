Transition = {
	// Takes a snapshot of an element, used as the source for a transition
	snapshot: function(element, attributes) {
		var res = {};
		/// Attributes
		if (attributes && window.getComputedStyle) {
			var style = getComputedStyle(element);
			res.attributes = {};
			for (var i = attributes.length; i --; ) {
				res.attributes[attributes[i]] =
					style.getPropertyValue(attributes[i]);
			}
		}
		/// Get the bounding rect for this element
		var rect = element.getBoundingClientRect();
		// Copy properties from that 
		res.left = rect.left;
		res.top = rect.top;
		res.width = rect.width;
		res.height = rect.height;
		// Return the snapshot
		return res;
	},
	// Translates from a source (snapshot) to a destination (element)
	// for the duration specified (in milliseconds)
	from: function(element, snapshot, duration) {
		// If the second argument was passed as an Element
		if (snapshot instanceof Element) {
			// Get the snapshot of that element
			snapshot = this.snapshot(snapshot);
		}
		// Capture the transition beforehand
		var transition = element.style.transition;
		// Clear the transtion
		element.style.transition = 'none';
		// Capture the transform from beforehand
		var transform = element.style.transform;
		// Clear the transform
		element.style.transform = 'none';
		/// Get the bounding rect for this element
		var rect = element.getBoundingClientRect();
		// Apply the new transform
		var scale = ['scale(', snapshot.width / rect.width, ',',
			snapshot.height / rect.height, ')'].join('');
		element.style.transform = scale;
		rect = element.getBoundingClientRect();
		element.style.transform = [
			'translate(',
			snapshot.left - rect.left, 'px,', snapshot.top - rect.top, 'px',
			')'
		].join('') + ' ' + scale;
		// Attributes
		var prevAttributes = {};
		var attributes = [];
		if (snapshot.attributes) {
			for (var prop in snapshot.attributes) {
				prevAttributes[prop] = element.style[prop];
				element.style[prop] = snapshot.attributes[prop];
				attributes.push(prop);
			}
		}
		// After a brief timeout, reset the transform
		setTimeout(function() {
			// Apply the new transition
			var sec = duration * 0.001 + 's';
			element.style.transition = ['transform'].concat(attributes
				).map(function(prop) {
					return prop + ' ' + sec;
				}).join(', ');
			element.style.transform = transform;
			if (attributes.length !== 0) {
				for (var i = attributes.length; i --; ) {
					var prop = attributes[i];
					element.style[prop] = prevAttributes[prop];
				}
			}
		}, 18);
		setTimeout(function() {
			element.style.transition = transition;
		}, duration);
	},
	// Dynamically executes a CSS animation that can have JS-calculated values
	animate: function(element, keyframes, duration) {
		var objToCSS = function(obj) {
			var res = [];
			for (var key in obj) {
				res.push(key + ':' + obj[key] + ';');
			}
			return res.join('');
		};
		var keyframeCSS = [];
		for (var k in keyframes) {
			if (k === 'from' || k === 'to') {
				keyframeCSS.push(k + ' {' + objToCSS(keyframes[k]) + '} ');
			} else if (+k === +k) {
				keyframeCSS.push(k + '% {' + objToCSS(keyframes[k]) + '} ');
			} else { // Property
				var frames = keyframes[k];
				for (var frame in frames) {
					if (frame === 'from' || frame === 'to') {
						keyframeCSS.push(frame + ' {' +
							k + ':' + frames[frame] + ';} ');
					} else {
						keyframeCSS.push(frame + '% {' +
							k + ':' + frames[frame] + ';} ');
					}
				}
			}
		}
		var style = document.createElement('style');
		style.type = 'text/css';
		var name = '___' + Math.floor(Math.random() * 1e16).toString(36);
		var css = '@keyframes ' + name + ' { ' + keyframeCSS.join('') + '}';
		style.innerHTML = css;
		document.head.appendChild(style);
		// Get the element's previous style.animation
		var animation = element.style.animation;
		// Start the animation
		element.style.animation = name + ' ' + (duration * 0.001) + 's';
		// After the duration of the animation
		setTimeout(function() {
			// Remove the style
			document.head.removeChild(style);
			// Reset the animation property
			element.style.animation = animation;
		}, duration);
	}
};