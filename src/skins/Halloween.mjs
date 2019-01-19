import {backtraced, pts, reflectX, symmetricX} from './helpers.mjs';

function roughY(v) {
	for (const pt of v) {
		pt.y += Math.random() * 0.02 - Math.random() * 0.01;
	}
	return v;
}

const HIDE = {
	style: {
		'opacity': 0,
	},
};

const EYE_STYLE = {
	'stroke': '#000000',
	'stroke-width': 5,
	'opacity': 1,
};

const EYE = pts([{x: 0.3, y: -0.05}, {x: 0.3, y: -0.02}]);

const EYE_SHADOW_STYLE = {
	'stroke': '#9CBD51',
	'stroke-width': 5,
};

const SCAR_BACK_STYLE = {
	'stroke': '#D5CA90',
	'stroke-width': 5,
};

const SCAR_STYLE = {
	'stroke': '#C99B72',
	'stroke-width': 2,
};

export default {
	ball: {
		style: {
			'stroke': '#506028',
			'stroke-width': 2,
			'fill': '#CADDA2',
		},
	},
	liftAngle: Math.PI * 0.07,
	components: {
		'hair': {
			style: {
				'stroke': '#826E40',
				'stroke-width': 2,
				'fill': '#B39C65',
			},
			closed: true,
			points: symmetricX(pts(roughY([
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
			]))),
		},
		'left-eye-shadow': {
			style: EYE_SHADOW_STYLE,
			points: pts([
				{x: -0.35, y: -0.14},
				{x: -0.25, y: -0.12},
			]),
		},
		'right-eye-shadow': {
			style: EYE_SHADOW_STYLE,
			points: pts([
				{x: 0.35, y: -0.14},
				{x: 0.25, y: -0.12},
			]),
		},
		'left-eye': {
			style: EYE_STYLE,
			points: reflectX(EYE),
		},
		'right-eye': {
			style: EYE_STYLE,
			points: EYE,
		},
		'right-cheek-scar-shade': {
			style: SCAR_BACK_STYLE,
			points: pts([
				{x: 0.6, y: 0.5},
				{x: 0.7, y: 0.2},
			]),
		},
		'right-cheek-scar-shade-stitch-1': {
			style: SCAR_BACK_STYLE,
			points: pts([
				{x: 0.55, y: 0.4},
				{x: 0.7, y: 0.45},
			]),
		},
		'right-cheek-scar-shade-stitch-2': {
			style: SCAR_BACK_STYLE,
			points: pts([
				{x: 0.6, y: 0.3},
				{x: 0.72, y: 0.35},
			]),
		},
		'right-cheek-scar-shade-stitch-3': {
			style: SCAR_BACK_STYLE,
			points: pts([
				{x: 0.65, y: 0.2},
				{x: 0.75, y: 0.25},
			]),
		},
		'right-cheek-scar': {
			style: SCAR_STYLE,
			points: pts([
				{x: 0.6, y: 0.5},
				{x: 0.7, y: 0.2},
			]),
		},
		'right-cheek-scar-stitch-1': {
			style: SCAR_STYLE,
			points: pts([
				{x: 0.55, y: 0.4},
				{x: 0.7, y: 0.45},
			]),
		},
		'right-cheek-scar-stitch-2': {
			style: SCAR_STYLE,
			points: pts([
				{x: 0.6, y: 0.3},
				{x: 0.72, y: 0.35},
			]),
		},
		'right-cheek-scar-stitch-3': {
			style: SCAR_STYLE,
			points: pts([
				{x: 0.65, y: 0.2},
				{x: 0.75, y: 0.25},
			]),
		},
		'nose': {
			style: {
				'stroke': '#000000',
				'stroke-width': 5,
			},
			flat: false,
			points: pts([
				{x: 0.0, y: 0.2, d: 1.0},
				{x: 0.0, y: 0.2, d: 1.1},
			]),
		},
		'mouth-shadow': {
			style: {
				'stroke': '#9CBD51',
				'stroke-width': 4,
				'fill': '#9CBD51',
			},
			closed: true,
			points: pts([
				{x: 0.00, y: 0.47},
				{x: 0.10, y: 0.48},
				{x: 0.20, y: 0.50},
				{x: 0.35, y: 0.60},
				{x: 0.30, y: 0.75},
				{x: 0.20, y: 0.85},
				{x: 0.10, y: 0.80},
				{x: 0.00, y: 0.90},
				{x:-0.10, y: 0.80},
				{x:-0.20, y: 0.75},
				{x:-0.30, y: 0.67},
				{x:-0.35, y: 0.60},
				{x:-0.20, y: 0.50},
				{x:-0.10, y: 0.48},
			]),
		},
		'mouth': {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
				'fill': '#77100E',
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
	mutualExpressions: [
		['normal', 'smile', 'sad', 'laugh', 'shock'],
	],
	expressions: {
		'eyes-closed': {
			components: {
				'left-eye': HIDE,
				'right-eye': HIDE,
			},
		},
		'smile': {
			components: {
				'mouth-shadow': {
					points: pts([
						{x: 0.00, y: 0.45},
						{x: 0.10, y: 0.44},
						{x: 0.30, y: 0.44},
						{x: 0.40, y: 0.46},
						{x: 0.30, y: 0.75},
						{x: 0.20, y: 0.85},
						{x: 0.10, y: 0.80},
						{x: 0.00, y: 0.90},
						{x:-0.10, y: 0.80},
						{x:-0.20, y: 0.75},
						{x:-0.30, y: 0.67},
						{x:-0.40, y: 0.46},
						{x:-0.30, y: 0.44},
						{x:-0.10, y: 0.44},
					]),
				},
				'mouth': {
					points: symmetricX(backtraced(pts([
						{x: 0.00, y: 0.650},
						{x: 0.20, y: 0.630},
						{x: 0.30, y: 0.590},
						{x: 0.36, y: 0.520},
					]))),
				},
			},
		},
		'sad': {
			components: {
				'mouth-shadow': {
					points: pts([
						{x: 0.00, y: 0.47},
						{x: 0.10, y: 0.48},
						{x: 0.20, y: 0.55},
						{x: 0.35, y: 0.65},
						{x: 0.30, y: 0.75},
						{x: 0.20, y: 0.85},
						{x: 0.10, y: 0.80},
						{x: 0.00, y: 0.90},
						{x:-0.10, y: 0.80},
						{x:-0.20, y: 0.75},
						{x:-0.30, y: 0.67},
						{x:-0.35, y: 0.65},
						{x:-0.20, y: 0.55},
						{x:-0.10, y: 0.48},
					]),
				},
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
				'mouth-shadow': {
					points: pts([
						{x: 0.00, y: 0.47},
						{x: 0.10, y: 0.48},
						{x: 0.20, y: 0.50},
						{x: 0.35, y: 0.60},
						{x: 0.30, y: 0.75},
						{x: 0.20, y: 0.85},
						{x: 0.10, y: 0.80},
						{x: 0.00, y: 0.90},
						{x:-0.10, y: 0.80},
						{x:-0.20, y: 0.75},
						{x:-0.30, y: 0.67},
						{x:-0.35, y: 0.60},
						{x:-0.20, y: 0.50},
						{x:-0.10, y: 0.48},
					]),
				},
				'mouth': {
					points: pts([
						{x: 0.00, y: 0.600},
						{x: 0.20, y: 0.600},
						{x: 0.25, y: 0.610},
						{x: 0.30, y: 0.650},
						{x: 0.20, y: 0.700},
						{x: 0.10, y: 0.720},
						{x: 0.00, y: 0.730},
						{x:-0.10, y: 0.720},
						{x:-0.20, y: 0.700},
						{x:-0.30, y: 0.650},
						{x:-0.25, y: 0.620},
						{x:-0.20, y: 0.610},
					]),
				},
			},
		},
		'shock': {
			components: {
				'mouth-shadow': {
					points: pts([
						{x: 0.00, y: 0.47},
						{x: 0.10, y: 0.48},
						{x: 0.20, y: 0.50},
						{x: 0.35, y: 0.60},
						{x: 0.30, y: 0.75},
						{x: 0.20, y: 0.85},
						{x: 0.10, y: 0.80},
						{x: 0.00, y: 0.90},
						{x:-0.10, y: 0.80},
						{x:-0.20, y: 0.75},
						{x:-0.30, y: 0.67},
						{x:-0.35, y: 0.60},
						{x:-0.20, y: 0.50},
						{x:-0.10, y: 0.48},
					]),
				},
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
