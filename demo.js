function toggle() {
	var card = document.getElementsByTagName('section')[0];
	var button = document.getElementsByTagName('button')[0];
	// Capture a snapshot of the card beforehand
	var snapshot = Transition.snapshot(card);
	// Expand/collapse the card
	if (card.className === '') {
		card.className = 'expanded';
		button.textContent = 'Collapse';
	} else {
		card.className = '';
		button.textContent = 'Expand';
	}
	// Animate the change
	Transition.animate(card, snapshot, 500);
}

function fab() {
	var section = document.createElement('section');
	section.className = 'expanded';
	section.innerHTML = "<header>Card</header>" +
		"<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod" +
		"tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam," +
		"quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo" +
		"consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse" +
		"cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non" +
		"proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>"/* +
		"<button onclick='toggle()'>Expand</button>"*/;
	var fab = document.getElementById('fab');
	document.body.insertBefore(section, fab);
	Transition.animate(section,
		Transition.snapshot(fab, ['border-radius']), 1000);
}