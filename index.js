import Face from './src/Face.js';
import Clyde from './faces/Clyde.js';
import TestPattern from './faces/TestPattern.js';

function makeTest() {
	const face = new Face({
		topography: TestPattern,
		radius: 40.0,
		padding: 10.0,
		zoom: 2.0,
	});
	document.body.appendChild(face.element());
	return face;
}

const face1 = new Face({
	topography: Clyde,
	radius: 40.0,
	padding: 10.0,
	zoom: 2.0,
});
face1.setRotation(Math.PI * 0.12, Math.PI * 0.03);
face1.setExpressions({
	'laugh': 1,
//	'eyes-closed': 1,
});
face1.render();
document.body.appendChild(face1.element());

const face2 = makeTest();
const face3 = makeTest();
const face4 = makeTest();
const face5 = makeTest();
face5.setRotation(Math.PI * 0.12, Math.PI * 0.03);
face5.render();

function setTestPos(pos) {
	face2.setRotation(pos, 0);
	face3.setRotation(0, pos);
	face4.setRotation(pos, pos * 1.07);
	face2.render();
	face3.render();
	face4.render();
}

setInterval(() => {
	setTestPos(Date.now() * 0.001);
}, 50);
