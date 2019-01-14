import Face from './src/Face.js';
import TestPattern from './faces/TestPattern.js';
import Clyde from './faces/Clyde.js';
import Christmas from './faces/Christmas.js';
import Bonfire from './faces/Bonfire.js';
import Halloween from './faces/Halloween.js';
import Eye from './faces/Eye.js';

const COMMON_CONFIG = {
	radius: 40.0,
	padding: 20.0,
	zoom: 2.0,
	container: document.body,
};

// Static renders

const STATIC_CONFIG = {
	...COMMON_CONFIG,
	initialRotation: {x: Math.PI * 0.12, y: Math.PI * 0.03},
};

new Face({...STATIC_CONFIG, topography: Clyde, initialExpressions: {'laugh': 1}});
new Face({...STATIC_CONFIG, topography: TestPattern});
new Face({...STATIC_CONFIG, topography: Eye});

document.body.appendChild(document.createElement('br'));

// Cursor-following

const follow = [];

follow.push(new Face({...COMMON_CONFIG, topography: Clyde}));
follow.push(new Face({...COMMON_CONFIG, topography: TestPattern}));
follow.push(new Face({...COMMON_CONFIG, topography: Eye}));

document.body.appendChild(document.createElement('br'));

follow.push(new Face({...COMMON_CONFIG, topography: Christmas}));
follow.push(new Face({...COMMON_CONFIG, topography: Bonfire}));
follow.push(new Face({...COMMON_CONFIG, topography: Halloween}));

function pickExpression(distance) {
	if (distance < 100) {
		return 'laugh';
	} else if (distance < 300) {
		return 'smile';
	} else if (distance < 600) {
		return 'neutral';
	} else {
		return 'sad';
	}
}

window.addEventListener('mousemove', (e) => {
	for (const face of follow) {
		const pos = face.getPagePosition();
		const dx = e.pageX - pos.x;
		const dy = e.pageY - pos.y;
		face.look(dx, dy, 300);
		face.setExpression(pickExpression(Math.sqrt(dx * dx + dy * dy)));
		face.render();
	}
});

document.body.appendChild(document.createElement('br'));

// Test patterns

const test1 = new Face({...COMMON_CONFIG, topography: TestPattern});
const test2 = new Face({...COMMON_CONFIG, topography: TestPattern});
const test3 = new Face({...COMMON_CONFIG, topography: TestPattern});

function step() {
	const pos = Date.now() * 0.001;
	test1.setRotation(pos, 0);
	test2.setRotation(0, pos);
	test3.setRotation(pos, pos * 1.07);
	test1.render();
	test2.render();
	test3.render();
	requestAnimationFrame(step);
}

step();
