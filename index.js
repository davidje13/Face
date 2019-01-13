import Face from './src/Face.js';
import TestPattern from './faces/TestPattern.js';
import Clyde from './faces/Clyde.js';
import Eye from './faces/Eye.js';

const COMMON_CONFIG = {
	radius: 40.0,
	padding: 10.0,
	zoom: 2.0,
	container: document.body,
};

const TEST_CONFIG = {
	...COMMON_CONFIG,
	topography: TestPattern,
};

const CLYDE_CONFIG = {
	...COMMON_CONFIG,
	topography: Clyde,
};

const EYE_CONFIG = {
	...COMMON_CONFIG,
	topography: Eye,
};

const static1 = new Face(CLYDE_CONFIG);
static1.setRotation(Math.PI * 0.12, Math.PI * 0.03);
static1.setExpressions({'laugh': 1});
static1.render();

const static2 = new Face(TEST_CONFIG);
static2.setRotation(Math.PI * 0.12, Math.PI * 0.03);
static2.render();

const static3 = new Face(EYE_CONFIG);
static3.setRotation(Math.PI * 0.12, Math.PI * 0.03);
static3.render();

document.body.appendChild(document.createElement('br'));

const follow1 = new Face(CLYDE_CONFIG);
const follow2 = new Face(TEST_CONFIG);
const follow3 = new Face(EYE_CONFIG);

document.body.appendChild(document.createElement('br'));

const test1 = new Face(TEST_CONFIG);
const test2 = new Face(TEST_CONFIG);
const test3 = new Face(TEST_CONFIG);

window.addEventListener('mousemove', (e) => {
	const pos = follow1.getPagePosition();
	const dx = e.pageX - pos.x;
	const dy = e.pageY - pos.y;
	let expression;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance < 100) {
		expression = 'laugh';
	} else if (distance < 300) {
		expression = 'smile';
	} else if (distance < 600) {
		expression = 'neutral';
	} else {
		expression = 'sad';
	}
	follow1.look(dx, dy, 200);
	follow1.setExpression(expression);
	follow1.render();

	const pos2 = follow2.getPagePosition();
	follow2.look(e.pageX - pos2.x, e.pageY - pos2.y, 200);
	follow2.render();

	const pos3 = follow3.getPagePosition();
	follow3.look(e.pageX - pos3.x, e.pageY - pos3.y, 200);
	follow3.render();
});

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
