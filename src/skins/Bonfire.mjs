import {backtraced, pts, reflectX, symmetricX} from './helpers.mjs';

const HIDE = {
	style: {
		'opacity': 0,
	},
};

const EYE_STYLE = {
	'stroke': '#000000',
	'stroke-width': 4,
	'opacity': 1,
};

const EYE = pts([{x: 0.3, y: -0.05}, {x: 0.3, y: -0.01}]);

const HAIR_STYLE = {
	'stroke': '#000000',
	'stroke-width': 3,
	'fill': '#382300',
};

const MOUSTACHE_NEUTRAL = pts([
	{x: 0.10, y: 0.480},
	{x: 0.20, y: 0.430},
	{x: 0.30, y: 0.410, d: 1.02},
	{x: 0.40, y: 0.300, d: 1.05},
	{x: 0.40, y: 0.410, d: 1.02},
	{x: 0.20, y: 0.530},
]);

const MOUSTACHE_SMILE = pts([
	{x: 0.10, y: 0.460},
	{x: 0.20, y: 0.410},
	{x: 0.30, y: 0.390, d: 1.02},
	{x: 0.40, y: 0.280, d: 1.05},
	{x: 0.40, y: 0.390, d: 1.02},
	{x: 0.20, y: 0.510},
]);

const MOUSTACHE_SAD = pts([
	{x: 0.10, y: 0.500},
	{x: 0.20, y: 0.470},
	{x: 0.30, y: 0.470, d: 1.02},
	{x: 0.40, y: 0.340, d: 1.05},
	{x: 0.40, y: 0.470, d: 1.02},
	{x: 0.20, y: 0.540},
]);

const MOUSTACHE_LAUGH = pts([
	{x: 0.10, y: 0.480},
	{x: 0.20, y: 0.430},
	{x: 0.30, y: 0.430, d: 1.02},
	{x: 0.40, y: 0.320, d: 1.05},
	{x: 0.40, y: 0.430, d: 1.02},
	{x: 0.20, y: 0.530},
]);

const MOUSTACHE_SHOCK = pts([
	{x: 0.10, y: 0.480},
	{x: 0.20, y: 0.430},
	{x: 0.30, y: 0.410, d: 1.02},
	{x: 0.40, y: 0.300, d: 1.05},
	{x: 0.40, y: 0.410, d: 1.02},
	{x: 0.20, y: 0.530},
]);

const HAT_STYLE = {
	'stroke': '#000000',
	'stroke-width': 3,
	'fill': '#111111',
};

export default {
	ball: {
		style: {
			'stroke': '#504020',
			'stroke-width': 2,
			'fill': '#FDE8AA',
		},
	},
	liftAngle: Math.PI * 0.07,
	hat: {
		brim: {
			y: -0.3,
			outerRadius: 1.4,
			style: HAT_STYLE,
		},
		sides: {
			style: HAT_STYLE,
		},
		top: {
			y: -1.2,
			radius: 0.6,
			style: HAT_STYLE,
		},
	},
	components: {
		'hair': {
			style: HAIR_STYLE,
			closed: true,
			points: symmetricX(pts([
				{x: 0.00, y: 0.00, back: true},
				{x: 0.20, y: 0.00, back: true},
				{x: 0.40, y: 0.00, back: true},
				{x: 0.60, y: 0.00, back: true},
				{x: 0.80, y: 0.20, back: true},
				{x: 0.81, y: 0.30, back: true},
				{x: 0.82, y: 0.40, back: true},
				{x: 0.83, y: 0.54, back: true},

				{x: 0.84, y: 0.54},
				{x: 0.83, y: 0.55},
				{x: 0.82, y: 0.55},
				{x: 0.81, y: 0.56},
				{x: 0.80, y: 0.54},
				{x: 0.79, y: 0.50},
				{x: 0.75, y: 0.42},
				{x: 0.70, y: 0.30},
				{x: 0.65, y: 0.15},
				{x: 0.60, y: 0.03},
				{x: 0.55, y:-0.07},
				{x: 0.50, y:-0.17},
				{x: 0.44, y:-0.25},
				{x: 0.40, y:-0.30},
				{x: 0.33, y:-0.35},
				{x: 0.24, y:-0.38},
				{x: 0.14, y:-0.40},
				{x: 0.00, y:-0.41},
			])),
		},
		'left-eye': {
			style: EYE_STYLE,
			points: reflectX(EYE),
		},
		'right-eye': {
			style: EYE_STYLE,
			points: EYE,
		},
		'mouth': {
			style: {
				'stroke': '#000000',
				'stroke-width': 3,
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
			points: symmetricX(pts([
				{x: 0.00, y: 0.750},
				{x: 0.15, y: 0.720},
				{x: 0.20, y: 0.750},
				{x: 0.10, y: 0.800, d: 1.1},
				{x: 0.00, y: 0.900, d: 1.3},
			])),
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
				'fill': '#FDE8AA',
				'stroke': '#000000',
				'stroke-width': 4,
			},
			flat: false,
			points: pts([
				{x: 0.0, y: 0.2, d: 1.0},
				{x: 0.0, y: 0.4, d: 1.2},
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
					points: symmetricX(pts([
						{x: 0.00, y: 0.750},
						{x: 0.17, y: 0.720},
						{x: 0.25, y: 0.700},
						{x: 0.12, y: 0.800, d: 1.1},
						{x: 0.00, y: 0.900, d: 1.3},
					])),
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
					points: symmetricX(pts([
						{x: 0.00, y: 0.750},
						{x: 0.15, y: 0.750},
						{x: 0.20, y: 0.770},
						{x: 0.10, y: 0.800, d: 1.1},
						{x: 0.00, y: 0.900, d: 1.3},
					])),
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
					points: symmetricX(pts([
						{x: 0.00, y: 0.850},
						{x: 0.15, y: 0.820},
						{x: 0.15, y: 0.850},
						{x: 0.10, y: 0.880, d: 1.1},
						{x: 0.00, y: 0.950, d: 1.4},
					])),
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
					points: symmetricX(pts([
						{x: 0.00, y: 0.850},
						{x: 0.15, y: 0.820},
						{x: 0.15, y: 0.850},
						{x: 0.10, y: 0.800, d: 1.1},
						{x: 0.00, y: 0.950, d: 1.4},
					])),
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
