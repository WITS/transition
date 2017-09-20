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
	animate: function(element, snapshot, duration) {
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
	}
};