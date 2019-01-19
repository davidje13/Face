const {Face} = window;

const COMMON_CONFIG = {
	container: document.body,
	padding: 20.0,
	radius: 40.0,
	zoom: 2.0,
};

// Static renders

const STATIC_CONFIG = {
	...COMMON_CONFIG,
	rotation: {x: Math.PI * 0.12, y: Math.PI * 0.03},
};

new Face({...STATIC_CONFIG, skin: 'Clyde', expressions: {'laugh': 1}});
new Face({...STATIC_CONFIG, skin: 'TestPattern'});
new Face({...STATIC_CONFIG, skin: 'Eye'});

document.body.appendChild(document.createElement('br'));

// Cursor-following

const follow = [];

follow.push(new Face({...COMMON_CONFIG, skin: 'Clyde'}));
follow.push(new Face({...COMMON_CONFIG, skin: 'TestPattern'}));
follow.push(new Face({...COMMON_CONFIG, skin: 'Eye'}));

document.body.appendChild(document.createElement('br'));

follow.push(new Face({...COMMON_CONFIG, skin: 'Christmas'}));
follow.push(new Face({...COMMON_CONFIG, skin: 'Bonfire'}));
follow.push(new Face({...COMMON_CONFIG, skin: 'Halloween'}));

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

const test1 = new Face({...COMMON_CONFIG, skin: 'TestPattern'});
const test2 = new Face({...COMMON_CONFIG, skin: 'TestPattern'});
const test3 = new Face({...COMMON_CONFIG, skin: 'TestPattern'});

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
