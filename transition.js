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
	},
	// Animates scrolling through an element or the window
	scroll: function(end, duration, options) {
		if (typeof end === 'object' && end !== window && !(end instanceof Element)) {
			options = end;
			end = null;
		} else if (typeof duration === 'object') {
			options = duration;
			duration = null;
		} else if (options == null) {
			options = {};
		}

		// Get the current scroll position of the element
		this.scrollElement = options.element || window;

		// If end is already a number
		if (typeof end === 'number') {
			this.scrollEndY = end;
		} else if (end instanceof Element) {
			// Get the correct property of this element
			var rect = end.getBoundingClientRect();
			this.scrollEndY = rect[options.align || 'top'] +
				this.scrollPosition(this.scrollElement);
			if (options.align === 'bottom') {
				if (this.scrollElement === window) {
					this.scrollEndY -= window.innerHeight;
				} else {
					this.scrollEndY -= this.scrollElement.getBoundingClientRect().height;
				}
			}
		} else {
			// Get the scroll position from the window
			if (options.align === 'bottom') {
				this.scrollEndY = document.documentElement.scrollHeight -
					window.innerHeight;
			} else {
				this.scrollEndY = 0;
			}
		}

		// Calculate the scroll distance
		this.scrollDistance = this.scrollEndY -
			this.scrollPosition(this.scrollElement);

		// If the scroll distance is 0, stop here
		if (this.scrollDistance === 0) {
			return;
		}

		// If the duration is variable
		if (options.per100) {
			this.scrollDuration = Math.abs(options.per100 * this.scrollDistance * 0.01);
		} else {
			this.scrollDuration = duration || options.duration || 500;
		}
		
		// Set other properties and begin scroll loop
		this.scrollInitialY = this.scrollPosition(this.scrollElement);
		this.scrollInitialT = Date.now();
		this.scrollPrevT = Date.now();
		this.isScrolling = true;
		
		this.requestFrame(this.scrollHelper);
	},
	// A simple polyfill for window.requestAnimationFrame that doesn't pollute the scope
	requestFrame: function(callback) {
		if (window.requestAnimationFrame) {
			window.requestAnimationFrame(callback);
		} else {
			setTimeout(function() {
				callback();
			}, 16);
		}
	},
	// A helper method to scroll in each animation frames
	scrollHelper: function() {
		var $this = Transition;
		if ($this.isScrolling === false) {
			return;
		}
		$this.requestFrame($this.scrollHelper);
		
		var now = Date.now();
		var delta = now - $this.scrollPrevT;
		$this.scrollPrevT = now;

		if (delta != 0) {
			var scrollY = $this.scrollPosition($this.scrollElement);
			// var diff = $this.scrollEndY - scrollY;
			var move = $this.scrollDistance * Math.min(($this.scrollPrevT - $this.scrollInitialT) /
				$this.scrollDuration, 1);

			$this.scrollTo($this.scrollInitialY + move);

			var newY = $this.scrollPosition($this.scrollElement);

			if (scrollY === newY || $this.scrollPrevT - $this.scrollInitialT > $this.scrollDuration) {
				$this.isScrolling = false;
			}
		}
	},
	// Gets the current scroll position of an element (or the window)
	scrollPosition: function(elem) {
		if (elem === window) {
			return window.pageYOffset || document.documentElement.scrollTop;
		} else {
			return elem.scrollTop;
		}
	},
	// Sets the current scroll position of an element (or the window)
	scrollTo: function(y) {
		if (this.scrollElement === window) {
			window.scrollTo(0, y);
		} else {
			this.scrollElement.scrollTop = y;
		}
	},
	// Scroll variables
	isScrolling: false,
	scrollEndY: 0,
	scrollDistance: 0,
	scrollElement: window,
	scrollPrevT: 0,
	scrollDuration: 500
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