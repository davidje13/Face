import {pts, symmetricX, reflectX, backtraced} from './helpers.js';

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

const EYE = pts([{x: 0.25, y: -0.05}, {x: 0.25, y: -0.02}]);

const CHEEK_STYLE = {
	'stroke': '#F7D1AF',
	'stroke-width': 5,
	'opacity': 1,
};

const CHEEK = pts([{x: 0.29, y: 0.08}]);

const HAIR_STYLE = {
	'stroke': '#202020',
	'stroke-width': 3,
	'fill': '#FFFFFF',
};

const MOUSTACHE_NEUTRAL = pts([
	{x: 0.06, y: 0.47},
	{x: 0.13, y: 0.38},
	{x: 0.21, y: 0.33, d: 1.02},
	{x: 0.31, y: 0.33, d: 1.02},
	{x: 0.48, y: 0.33, d: 1.02},
	{x: 0.61, y: 0.34, d: 1.05},
	{x: 0.52, y: 0.45, d: 1.02},
	{x: 0.39, y: 0.53},
	{x: 0.25, y: 0.57},
	{x: 0.16, y: 0.58},
	{x: 0.06, y: 0.55},
]);

const MOUSTACHE_SMILE = pts([
	{x: 0.06, y: 0.47},
	{x: 0.13, y: 0.38},
	{x: 0.21, y: 0.33, d: 1.02},
	{x: 0.33, y: 0.31, d: 1.02},
	{x: 0.49, y: 0.29, d: 1.02},
	{x: 0.62, y: 0.29, d: 1.05},
	{x: 0.53, y: 0.43, d: 1.02},
	{x: 0.39, y: 0.52},
	{x: 0.26, y: 0.56},
	{x: 0.16, y: 0.58},
	{x: 0.06, y: 0.55},
]);

const MOUSTACHE_SAD = pts([
	{x: 0.06, y: 0.47},
	{x: 0.13, y: 0.38},
	{x: 0.21, y: 0.33, d: 1.02},
	{x: 0.31, y: 0.33, d: 1.02},
	{x: 0.48, y: 0.33, d: 1.02},
	{x: 0.61, y: 0.34, d: 1.05},
	{x: 0.52, y: 0.45, d: 1.02},
	{x: 0.39, y: 0.53},
	{x: 0.25, y: 0.57},
	{x: 0.16, y: 0.58},
	{x: 0.06, y: 0.55},
]);

const MOUSTACHE_LAUGH = pts([
	{x: 0.06, y: 0.47},
	{x: 0.13, y: 0.38},
	{x: 0.21, y: 0.33, d: 1.02},
	{x: 0.32, y: 0.28, d: 1.02},
	{x: 0.45, y: 0.24, d: 1.02},
	{x: 0.57, y: 0.25, d: 1.05},
	{x: 0.52, y: 0.39, d: 1.02},
	{x: 0.39, y: 0.49},
	{x: 0.26, y: 0.55},
	{x: 0.16, y: 0.58},
	{x: 0.06, y: 0.55},
]);

const MOUSTACHE_SHOCK = pts([
	{x: 0.06, y: 0.47},
	{x: 0.13, y: 0.38},
	{x: 0.21, y: 0.33, d: 1.02},
	{x: 0.31, y: 0.33, d: 1.02},
	{x: 0.48, y: 0.33, d: 1.02},
	{x: 0.61, y: 0.34, d: 1.05},
	{x: 0.52, y: 0.45, d: 1.02},
	{x: 0.39, y: 0.53},
	{x: 0.25, y: 0.57},
	{x: 0.16, y: 0.58},
	{x: 0.06, y: 0.55},
]);

export default {
	ball: {
		style: {
			'fill': '#F7D1AF',
		},
	},
	liftAngle: Math.PI * 0.1,
	hat: {
		brim: {
			y: -0.6,
		},
		top: {
			y: -1.9,
			radius: 0,
		},
	},
	components: {
		'left-eye': {
			style: EYE_STYLE,
			points: reflectX(EYE),
		},
		'right-eye': {
			style: EYE_STYLE,
			points: EYE,
		},
		'left-cheek': {
			style: CHEEK_STYLE,
			points: reflectX(CHEEK),
		},
		'right-cheek': {
			style: CHEEK_STYLE,
			points: CHEEK,
		},
		'forced-outline': {
			style: {
				'stroke': '#000000',
				'stroke-width': 3,
			},
			closed: true,
			// arbitrary shape on back of head to force rendering outline above cheeks
			points: pts([
				{x: 0.0, y:-0.1, back: true},
				{x: 0.1, y: 0.1, back: true},
				{x:-0.1, y: 0.1, back: true},
			]),
		},
		'hair': {
			style: HAIR_STYLE,
			closed: true,
			points: pts([
				{x: 0.09, y: 0.88},
				{x: 0.24, y: 0.83},
				{x: 0.36, y: 0.75},
				{x: 0.46, y: 0.66},
				{x: 0.51, y: 0.52},
				{x: 0.53, y: 0.37},
				{x: 0.49, y: 0.24},
				{x: 0.51, y: 0.14},
				{x: 0.48, y: 0.03},
				{x: 0.48, y:-0.08},
				{x: 0.44, y:-0.18},
				{x: 0.36, y:-0.27},
				{x: 0.27, y:-0.35},
				{x: 0.14, y:-0.40},
				{x: 0.01, y:-0.40},
				{x:-0.13, y:-0.36},
				{x:-0.24, y:-0.33},
				{x:-0.35, y:-0.29},
				{x:-0.41, y:-0.22},
				{x:-0.45, y:-0.16},
				{x:-0.52, y:-0.08},
				{x:-0.52, y: 0.04},
				{x:-0.50, y: 0.17},
				{x:-0.51, y: 0.32},
				{x:-0.52, y: 0.45},
				{x:-0.54, y: 0.56},
				{x:-0.50, y: 0.67},
				{x:-0.38, y: 0.78},
				{x:-0.25, y: 0.86},
				{x:-0.09, y: 0.90},
			]),
		},
		'mouth': {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
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
		'beard': {
			style: HAIR_STYLE,
			flat: false,
			closed: true,
			points: pts([
				{x: 0.12, y: 0.67},
				{x: 0.25, y: 0.62},
				{x: 0.31, y: 0.59},
				{x: 0.46, y: 0.54},
				{x: 0.54, y: 0.65},
				{x: 0.54, y: 0.65},
				{x: 0.34, y: 0.90, d: 1.1},
				{x: 0.00, y: 0.98, d: 1.1},
				{x:-0.29, y: 0.93, d: 1.1},
				{x:-0.51, y: 0.83},
				{x:-0.61, y: 0.62},
				{x:-0.55, y: 0.51},
				{x:-0.37, y: 0.54},
				{x:-0.22, y: 0.63},
				{x:-0.08, y: 0.67},
			]),
		},
		'left-moustache': {
			style: HAIR_STYLE,
			flat: false,
			closed: true,
			points: reflectX(MOUSTACHE_NEUTRAL),
		},
		'right-moustache': {
			style: HAIR_STYLE,
			flat: false,
			closed: true,
			points: MOUSTACHE_NEUTRAL,
		},
		'nose': {
			style: {
				'stroke': '#403020',
				'stroke-width': 3,
				'fill': '#F7D1AF',
			},
			flat: false,
			points: pts([
				{x: 0.0, y: 0.2, d: 1.0},
				{x: 0.0, y: 0.4, d: 1.15},
				{x: 0.0, y: 0.5, d: 1.0},
			]),
		},
	},
	expressions: {
		'eyes-closed': {
			components: {
				'left-eye': HIDE,
				'right-eye': HIDE,
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
				'beard': {
					points: pts([
						{x: 0.15, y: 0.64},
						{x: 0.31, y: 0.55},
						{x: 0.39, y: 0.46},
						{x: 0.55, y: 0.48},
						{x: 0.57, y: 0.63},
						{x: 0.53, y: 0.79},
						{x: 0.34, y: 0.88, d: 1.1},
						{x:-0.01, y: 0.96, d: 1.1},
						{x:-0.33, y: 0.91, d: 1.1},
						{x:-0.53, y: 0.81},
						{x:-0.61, y: 0.62},
						{x:-0.60, y: 0.47},
						{x:-0.45, y: 0.46},
						{x:-0.30, y: 0.60},
						{x:-0.08, y: 0.67},
					]),
				},
				'left-moustache': {
					points: reflectX(MOUSTACHE_SMILE),
				},
				'right-moustache': {
					points: MOUSTACHE_SMILE,
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
				'beard': {
					points: pts([
						{x: 0.10, y: 0.61},
						{x: 0.22, y: 0.64},
						{x: 0.28, y: 0.64},
						{x: 0.41, y: 0.55},
						{x: 0.53, y: 0.55},
						{x: 0.54, y: 0.65},
						{x: 0.34, y: 0.90, d: 1.1},
						{x: 0.00, y: 0.98, d: 1.1},
						{x:-0.29, y: 0.93, d: 1.1},
						{x:-0.51, y: 0.83},
						{x:-0.61, y: 0.62},
						{x:-0.55, y: 0.53},
						{x:-0.41, y: 0.55},
						{x:-0.26, y: 0.63},
						{x:-0.08, y: 0.60},
					]),
				},
				'left-moustache': {
					points: reflectX(MOUSTACHE_SAD),
				},
				'right-moustache': {
					points: MOUSTACHE_SAD,
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
				'beard': {
					points: pts([
						{x: 0.08, y: 0.75},
						{x: 0.24, y: 0.67},
						{x: 0.31, y: 0.57},
						{x: 0.46, y: 0.54},
						{x: 0.56, y: 0.58},
						{x: 0.56, y: 0.69},
						{x: 0.34, y: 0.90, d: 1.1},
						{x: 0.00, y: 0.98, d: 1.1},
						{x:-0.29, y: 0.93, d: 1.1},
						{x:-0.51, y: 0.83},
						{x:-0.61, y: 0.62},
						{x:-0.55, y: 0.51},
						{x:-0.37, y: 0.54},
						{x:-0.23, y: 0.69},
						{x:-0.10, y: 0.75},
					]),
				},
				'left-moustache': {
					points: reflectX(MOUSTACHE_LAUGH),
				},
				'right-moustache': {
					points: MOUSTACHE_LAUGH,
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
				'beard': {
					points: pts([
						{x: 0.08, y: 0.75},
						{x: 0.24, y: 0.67},
						{x: 0.31, y: 0.57},
						{x: 0.46, y: 0.54},
						{x: 0.56, y: 0.58},
						{x: 0.56, y: 0.69},
						{x: 0.34, y: 0.90, d: 1.1},
						{x: 0.00, y: 0.98, d: 1.1},
						{x:-0.29, y: 0.93, d: 1.1},
						{x:-0.51, y: 0.83},
						{x:-0.61, y: 0.62},
						{x:-0.55, y: 0.51},
						{x:-0.37, y: 0.54},
						{x:-0.23, y: 0.69},
						{x:-0.10, y: 0.75},
					]),
				},
				'left-moustache': {
					points: reflectX(MOUSTACHE_SHOCK),
				},
				'right-moustache': {
					points: MOUSTACHE_SHOCK,
				},
			},
		},
	},
};
