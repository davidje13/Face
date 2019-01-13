import {pts, symmetricX, backtraced} from './helpers.js';

export default {
	ball: {
		style: {
			'stroke': '#000000',
			'stroke-width': 2,
			'fill': '#FDE8AA',
		},
	},
	liftAngle: Math.PI * 0.07,
	components: {
		'hair': {
			style: {
				'stroke': '#695320',
				'stroke-width': 2,
				'stroke-linejoin': 'round',
				'fill': '#C69F45',
			},
			closed: true,
			points: symmetricX(pts([
				{x: 0.00, y: -0.09, back: true},
				{x: 0.20, y: -0.09, back: true},
				{x: 0.40, y: -0.09, back: true},
				{x: 0.60, y: -0.09, back: true},
				{x: 0.80, y: -0.09, back: true},
				{x: 0.90, y: -0.09, back: true},
				{x: 0.95, y: -0.09, back: true},
				{x: 0.97, y: -0.09, back: true},

				{x: 0.99, y: -0.09},
				{x: 0.97, y: -0.10},
				{x: 0.95, y: -0.12},
				{x: 0.93, y: -0.16},
				{x: 0.91, y: -0.18},
				{x: 0.88, y: -0.19},
				{x: 0.85, y: -0.18},
				{x: 0.82, y: -0.16},
				{x: 0.79, y: -0.14},
				{x: 0.76, y: -0.12},
				{x: 0.73, y: -0.11},
				{x: 0.70, y: -0.12},
				{x: 0.67, y: -0.14},
				{x: 0.62, y: -0.18},
				{x: 0.55, y: -0.23},
				{x: 0.48, y: -0.28},
				{x: 0.40, y: -0.32},
				{x: 0.33, y: -0.35},
				{x: 0.24, y: -0.38},
				{x: 0.14, y: -0.40},
				{x: 0.00, y: -0.41},
			])),
		},
		'left-eye': {
			style: {
				'stroke': '#000000',
				'stroke-width': 5,
				'stroke-linecap': 'round',
				'opacity': 1,
			},
			points: pts([{x: -0.3, y: -0.05}]),
		},
		'right-eye': {
			style: {
				'stroke': '#000000',
				'stroke-width': 5,
				'stroke-linecap': 'round',
				'opacity': 1,
			},
			points: pts([{x: 0.3, y: -0.05}]),
		},
		'nose': {
			style: {
				'stroke': '#000000',
				'stroke-width': 5,
				'stroke-linecap': 'round',
			},
			flat: false,
			points: pts([
				{x: 0.0, y: 0.2, d: 1.0},
				{x: 0.0, y: 0.2, d: 1.2},
			]),
		},
		'mouth': {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
				'stroke-linejoin': 'round',
				'fill': '#FFFFFF',
			},
			closed: true,
			points: symmetricX(backtraced(pts([
				{x: 0.00, y: 0.640},
				{x: 0.10, y: 0.635},
				{x: 0.20, y: 0.620},
				{x: 0.30, y: 0.600},
			]))),
		},
	},
	expressions: {
		'eyes-closed': {
			components: {
				'left-eye': {
					style: {
						'opacity': 0,
					},
				},
				'right-eye': {
					style: {
						'opacity': 0,
					},
				},
			},
		},
		'smile': {
			components: {
				'mouth': {
					points: symmetricX(backtraced(pts([
						{x: 0.00, y: 0.650},
						{x: 0.12, y: 0.630},
						{x: 0.24, y: 0.590},
						{x: 0.36, y: 0.520},
					]))),
				},
			},
		},
		'sad': {
			components: {
				'mouth': {
					points: symmetricX(backtraced(pts([
						{x: 0.00, y: 0.639},
						{x: 0.10, y: 0.641},
						{x: 0.20, y: 0.645},
						{x: 0.30, y: 0.650},
					]))),
				},
			},
		},
		'laugh': {
			components: {
				'mouth': {
					points: symmetricX(pts([
						{x: 0.00, y: 0.640},
						{x: 0.10, y: 0.630},
						{x: 0.20, y: 0.610},
						{x: 0.30, y: 0.580},
						{x: 0.20, y: 0.680},
						{x: 0.10, y: 0.760},
						{x: 0.00, y: 0.780},
					])),
				},
			},
		},
		'shock': {
			components: {
				'mouth': {
					points: symmetricX(pts([
						{x: 0.00, y: 0.625},
						{x: 0.10, y: 0.630},
						{x: 0.15, y: 0.640},
						{x: 0.20, y: 0.660},
						{x: 0.15, y: 0.700},
						{x: 0.10, y: 0.740},
						{x: 0.00, y: 0.750},
					])),
				},
			},
		},
	},
};
