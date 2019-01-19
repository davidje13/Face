import {backtraced, pts, reflectX, symmetricX} from './helpers.mjs';

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

const EYE = pts([[0.3, -0.05]]);

export const HAIR_RAW = [
	[0.00, -0.09, true],
	[0.20, -0.09, true],
	[0.40, -0.09, true],
	[0.60, -0.09, true],
	[0.80, -0.09, true],
	[0.90, -0.09, true],
	[0.95, -0.09, true],
	[0.97, -0.09, true],

	[0.99, -0.09],
	[0.97, -0.10],
	[0.95, -0.12],
	[0.93, -0.16],
	[0.91, -0.18],
	[0.88, -0.19],
	[0.85, -0.18],
	[0.82, -0.16],
	[0.79, -0.14],
	[0.76, -0.12],
	[0.73, -0.11],
	[0.70, -0.12],
	[0.67, -0.14],
	[0.62, -0.18],
	[0.55, -0.23],
	[0.48, -0.28],
	[0.40, -0.32],
	[0.33, -0.35],
	[0.24, -0.38],
	[0.14, -0.40],
	[0.00, -0.41],
];

export const MOUTH_NORMAL = symmetricX(backtraced(pts([
	[0.00, 0.640],
	[0.10, 0.635],
	[0.20, 0.620],
	[0.30, 0.600],
])));

export const MOUTH_SMILE = symmetricX(backtraced(pts([
	[0.00, 0.650],
	[0.12, 0.630],
	[0.24, 0.590],
	[0.36, 0.520],
])));

export const MOUTH_SAD = symmetricX(backtraced(pts([
	[0.00, 0.639],
	[0.10, 0.641],
	[0.20, 0.645],
	[0.30, 0.650],
])));

export const MOUTH_LAUGH = symmetricX(pts([
	[0.00, 0.640],
	[0.10, 0.630],
	[0.20, 0.610],
	[0.30, 0.580],
	[0.20, 0.680],
	[0.10, 0.760],
	[0.00, 0.780],
]));

export const MOUTH_SHOCK = symmetricX(pts([
	[0.00, 0.625],
	[0.10, 0.630],
	[0.15, 0.640],
	[0.20, 0.660],
	[0.15, 0.700],
	[0.10, 0.740],
	[0.00, 0.750],
]));

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
				'fill': '#C69F45',
			},
			closed: true,
			points: symmetricX(pts(HAIR_RAW)),
		},
		'left-eye': {
			style: EYE_STYLE,
			points: reflectX(EYE),
		},
		'right-eye': {
			style: EYE_STYLE,
			points: EYE,
		},
		'nose': {
			style: {
				'stroke': '#000000',
				'stroke-width': 5,
			},
			flat: false,
			points: pts([
				[0.0, 0.2, null, 1.0],
				[0.0, 0.2, null, 1.2],
			]),
		},
		'mouth': {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
				'fill': '#FFFFFF',
			},
			closed: true,
			points: MOUTH_NORMAL,
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
				'mouth': {
					points: MOUTH_SMILE,
				},
			},
		},
		'sad': {
			components: {
				'mouth': {
					points: MOUTH_SAD,
				},
			},
		},
		'laugh': {
			components: {
				'mouth': {
					points: MOUTH_LAUGH,
				},
			},
		},
		'shock': {
			components: {
				'mouth': {
					points: MOUTH_SHOCK,
				},
			},
		},
	},
};
