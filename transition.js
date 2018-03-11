/*
MIT License

Copyright (c) 2018 Ian B Jones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
		return new Transition.Snapshot(res);
	},
	// Translates from a source (snapshot) to a destination (element)
	// for the duration specified (in milliseconds)
	from: function(element, snapshot, duration, options) {
		if (!options) options = {};
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
		var scaleW = snapshot.width / rect.width;
		var scaleH = snapshot.height / rect.height;

		if (options.aspectRatio === 'width') {
			scaleH = scaleW;
		} else if (options.aspectRatio === 'height') {
			scaleW = scaleH;
		} else if (options.aspectRatio === 'none') {
			scaleW = scaleH = 1;
		}

		var scale = ['scale(', scaleW, ',', scaleH, ')'].join('');
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
					return prop + ' ' + sec + ' ' + (options.timing || 'ease') + ' ' +
					((options.delay || 0) * 0.001) + 's';
				}).join(', ');
			element.style.transform = transform;
			if (attributes.length !== 0) {
				for (var i = attributes.length; i --; ) {
					var prop = attributes[i];
					element.style[prop] = prevAttributes[prop];
				}
			}
		}, 18);
		// Create the object for chaining callbacks
		var res = new this.Callbacks();
		// After the transition is complete
		setTimeout(function() {
			// Reset the transition
			element.style.transition = transition;
			// Call any callbacks
			res.done();
		}, duration + (options.delay || 0));
		return res;
	},
	// Dynamically executes a CSS animation that can have JS-calculated values
	animate: function(element, keyframes, duration, options) {
		if (!options) options = {};
		// If there are multiple elements
		if (element.length && (element.length !== 1 ||
			element[0] !== element)) {
			for (var i = element.length; i --; ) {
				Transition.animate(element[i], keyframes, duration);
			}
			return;
		}
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
		element.style.animation = name + ' ' + (duration * 0.001) + 's ' +
			(options.timing || 'ease') + ' ' + ((options.delay || 0) * 0.001) + 's';
		// Create the object for chaining callbacks
		var res = new this.Callbacks();
		// After the duration of the animation
		setTimeout(function() {
			// Remove the style
			document.head.removeChild(style);
			// Reset the animation property
			element.style.animation = animation;
			// Call any callbacks
			res.done();
		}, duration + (options.delay || 0));
		return res;
	}
};

Transition.Callbacks = function() {
	this.callbacks = [];
}

Transition.Callbacks.prototype.then = function(c) {
	this.callbacks.push(c);
	return this;
}

Transition.Callbacks.prototype.done = function() {
	for (var x = 0, y = this.callbacks.length; x < y; ++ x) {
		this.callbacks[x]();
	}
}

Transition.Snapshot = function(json) {
	this.left = json.left;
	this.top = json.top;
	this.width = json.width;
	this.height = json.height;
	this.attributes = json.attributes;
}

Transition.Snapshot.prototype.left = 0;
Transition.Snapshot.prototype.top = 0;
Transition.Snapshot.prototype.width = 0;
Transition.Snapshot.prototype.height = 0;

Transition.Snapshot.prototype.setAttribute = function(name, value) {
	if (this.attributes == null) this.attributes = {};
	this.attributes[name] = value;
}