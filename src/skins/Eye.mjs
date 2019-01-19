import {pts} from './helpers.mjs';

function circle(rad, steps) {
	const result = [];
	for (let i = 0; i < steps; ++ i) {
		const angle = i * Math.PI * 2 / steps;
		result.push({x: Math.sin(angle) * rad, y: -Math.cos(angle) * rad});
	}
	return result;
}

export default {
	ball: {
		style: {
			'stroke': '#808080',
			'stroke-width': 2,
			'fill': '#FFFFFF',
		},
	},
	components: {
		'iris': {
			style: {
				'stroke': '#008000',
				'stroke-width': 2,
				'fill': '#00CC66',
			},
			closed: true,
			points: pts(circle(0.5, 32)),
		},
		'pupil': {
			style: {
				'stroke': '#000000',
				'stroke-width': 1,
				'fill': '#000000',
			},
			closed: true,
			points: pts(circle(0.2, 32)),
		},
	},
};
