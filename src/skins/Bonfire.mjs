import {
	MOUTH_LAUGH,
	MOUTH_NORMAL,
	MOUTH_SAD,
	MOUTH_SHOCK,
	MOUTH_SMILE,
} from './Doe.mjs';
import {pts, reflectX, symmetricX} from './helpers.mjs';

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

const EYE = pts([[0.3, -0.05], [0.3, -0.01]]);

const HAIR_STYLE = {
	'stroke': '#000000',
	'stroke-width': 3,
	'fill': '#382300',
};

const MOUSTACHE_NEUTRAL = pts([
	[0.10, 0.480],
	[0.20, 0.430],
	[0.30, 0.410, null, 1.02],
	[0.40, 0.300, null, 1.05],
	[0.40, 0.410, null, 1.02],
	[0.20, 0.530],
]);

const MOUSTACHE_SMILE = pts([
	[0.10, 0.460],
	[0.20, 0.410],
	[0.30, 0.390, null, 1.02],
	[0.40, 0.280, null, 1.05],
	[0.40, 0.390, null, 1.02],
	[0.20, 0.510],
]);

const MOUSTACHE_SAD = pts([
	[0.10, 0.500],
	[0.20, 0.470],
	[0.30, 0.470, null, 1.02],
	[0.40, 0.340, null, 1.05],
	[0.40, 0.470, null, 1.02],
	[0.20, 0.540],
]);

const MOUSTACHE_LAUGH = pts([
	[0.10, 0.480],
	[0.20, 0.430],
	[0.30, 0.430, null, 1.02],
	[0.40, 0.320, null, 1.05],
	[0.40, 0.430, null, 1.02],
	[0.20, 0.530],
]);

const MOUSTACHE_SHOCK = pts([
	[0.10, 0.480],
	[0.20, 0.430],
	[0.30, 0.410, null, 1.02],
	[0.40, 0.300, null, 1.05],
	[0.40, 0.410, null, 1.02],
	[0.20, 0.530],
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
				[0.00, 0.00, true],
				[0.20, 0.00, true],
				[0.40, 0.00, true],
				[0.60, 0.00, true],
				[0.80, 0.20, true],
				[0.81, 0.30, true],
				[0.82, 0.40, true],
				[0.83, 0.54, true],

				[0.84, 0.54],
				[0.83, 0.55],
				[0.82, 0.55],
				[0.81, 0.56],
				[0.80, 0.54],
				[0.79, 0.50],
				[0.75, 0.42],
				[0.70, 0.30],
				[0.65, 0.15],
				[0.60, 0.03],
				[0.55,-0.07],
				[0.50,-0.17],
				[0.44,-0.25],
				[0.40,-0.30],
				[0.33,-0.35],
				[0.24,-0.38],
				[0.14,-0.40],
				[0.00,-0.41],
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
			points: MOUTH_NORMAL,
		},
		'beard': {
			style: HAIR_STYLE,
			flat: false,
			closed: true,
			points: symmetricX(pts([
				[0.00, 0.750],
				[0.15, 0.720],
				[0.20, 0.750],
				[0.10, 0.800, null, 1.1],
				[0.00, 0.900, null, 1.3],
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
				[0.0, 0.2, null, 1.0],
				[0.0, 0.4, null, 1.2],
				[0.0, 0.5, null, 1.0],
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
					points: MOUTH_SMILE,
				},
				'beard': {
					points: symmetricX(pts([
						[0.00, 0.750],
						[0.17, 0.720],
						[0.25, 0.700],
						[0.12, 0.800, null, 1.1],
						[0.00, 0.900, null, 1.3],
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
					points: MOUTH_SAD,
				},
				'beard': {
					points: symmetricX(pts([
						[0.00, 0.750],
						[0.15, 0.750],
						[0.20, 0.770],
						[0.10, 0.800, null, 1.1],
						[0.00, 0.900, null, 1.3],
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
					points: MOUTH_LAUGH,
				},
				'beard': {
					points: symmetricX(pts([
						[0.00, 0.850],
						[0.15, 0.820],
						[0.15, 0.850],
						[0.10, 0.880, null, 1.1],
						[0.00, 0.950, null, 1.4],
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
					points: MOUTH_SHOCK,
				},
				'beard': {
					points: symmetricX(pts([
						[0.00, 0.850],
						[0.15, 0.820],
						[0.15, 0.850],
						[0.10, 0.800, null, 1.1],
						[0.00, 0.950, null, 1.4],
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
