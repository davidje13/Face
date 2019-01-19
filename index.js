const follow = [];
const test = [];

window.addEventListener('DOMContentLoaded', () => {
	const {Face} = window;
	follow.push(...Face.findConverted('follow'));
	test.push(...Face.findConverted('test'));
});

// Cursor-following

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

// Test patterns

function step() {
	const pos = Date.now() * 0.001;
	for (const face of test) {
		const x = Number(face.element().dataset.testRotateX);
		const y = Number(face.element().dataset.testRotateY);
		face.setRotation(pos * x, pos * y);
		face.render();
	}
	requestAnimationFrame(step);
}

step();
