import {backtraced, pts, reflectX, symmetricX} from './helpers.mjs';
import {blendColours} from '../core/blend.mjs';

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

const HAIR_RAW = new Map();

function addHairStyle(name, surface, raised = [], raisedRadius = 0) {
	HAIR_RAW.set(name, {surface, raised, raisedRadius});
	return name;
}

const SHORT_HAIR = symmetricX([
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
]);

const PARTED_HAIR = [
	[ 0.00, 0.43, true],
	[ 0.20, 0.42, true],
	[ 0.40, 0.40, true],
	[ 0.60, 0.38, true],
	[ 0.80, 0.35, true],
	[ 0.90, 0.30, true],
	[ 0.95, 0.23, true],
	[ 0.97, 0.20, true],

	[ 0.99, 0.10],
	[ 0.98, 0.07],
	[ 0.96, 0.04],
	[ 0.94, 0.01],
	[ 0.92,-0.02],
	[ 0.90,-0.05],
	[ 0.87,-0.08],
	[ 0.84,-0.11],
	[ 0.81,-0.14],
	[ 0.78,-0.16],
	[ 0.75,-0.18],
	[ 0.72,-0.20],
	[ 0.67,-0.22],
	[ 0.62,-0.24],
	[ 0.56,-0.26],
	[ 0.48,-0.28],
	[ 0.39,-0.30],
	[ 0.31,-0.32],
	[ 0.25,-0.34],
	[ 0.20,-0.36],
	[ 0.15,-0.39],
	[ 0.11,-0.42],
	[ 0.08,-0.45],
	[ 0.05,-0.50],
	[ 0.03,-0.55],
	[-0.06,-0.53],
	[-0.14,-0.51],
	[-0.28,-0.48],
	[-0.30,-0.47],
	[-0.39,-0.44],
	[-0.48,-0.40],
	[-0.55,-0.37],
	[-0.62,-0.33],
	[-0.68,-0.29],
	[-0.73,-0.25],
	[-0.78,-0.21],
	[-0.82,-0.16],
	[-0.86,-0.11],
	[-0.92,-0.02],
	[-0.94, 0.03],
	[-0.96, 0.08],
	[-0.99, 0.20],

	[-0.97, 0.23, true],
	[-0.95, 0.25, true],
	[-0.90, 0.31, true],
	[-0.80, 0.36, true],
	[-0.60, 0.37, true],
	[-0.40, 0.40, true],
	[-0.20, 0.42, true],
];

const BUN = [
	[0, -1.15, -0.3],
];

const PONYTAIL = [
	[0, 0.50, null, -1.00],
	[0, 0.50, null, -1.15],
	[0, 0.49, null, -1.24],
	[0, 0.47, null, -1.30],
	[0, 0.43, null, -1.36],
	[0, 0.35, null, -1.43],
	[0, 0.30, null, -1.44],
	[0, 0.20, null, -1.45],
	[0, 0.10, null, -1.47],
	[0, 0.00, null, -1.47],
	[0,-0.10, null, -1.43],
	[0,-0.20, null, -1.41],
	[0,-0.30, null, -1.37],
	[0,-0.40, null, -1.33],
	[0,-0.44, null, -1.25],
	[0,-0.30, null, -1.20],
	[0,-0.20, null, -1.20],
	[0,-0.10, null, -1.15],
	[0, 0.00, null, -1.10],
	[0, 0.10, null, -1.10],
	[0, 0.20, null, -1.05],
	[0, 0.25, null, -1.00],
];

const HAIR_STYLES = {
	BALD: addHairStyle('bald', []),
	PARTED: addHairStyle('parted', PARTED_HAIR),
	PARTED_BUN: addHairStyle('parted_bun', PARTED_HAIR, BUN, 18),
	PARTED_PONYTAIL: addHairStyle('parted_ponytail', PARTED_HAIR, PONYTAIL, 18),
	SHORT: addHairStyle('short', SHORT_HAIR),
	SHORT_BUN: addHairStyle('short_bun', SHORT_HAIR, BUN, 18),
	SHORT_PONYTAIL: addHairStyle('short_ponytail', SHORT_HAIR, PONYTAIL, 18),
};

function hairData(style = null) {
	if (style === null) {
		return HAIR_RAW.get('bald');
	}
	const data = HAIR_RAW.get(style);
	if (!data) {
		throw new Error('Unknown hair style: ' + style);
	}
	return data;
}

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

function fillFrom(style) {
	if (!style) {
		return 'rgba(0,0,0,0)';
	} else if (typeof style === 'object') {
		return style.fill;
	} else if (typeof style === 'string') {
		return style;
	} else {
		throw new Error('Unknown fill type: ' + style);
	}
}

function strokeFrom(style, defaultLum) {
	if (typeof style === 'object' && style.stroke) {
		return style.stroke;
	}
	if (defaultLum === 0) {
		return '#000000';
	}
	return blendColours('#000000', fillFrom(style), defaultLum);
}

const makeFace = ({skin, hair, hairStyle}) => ({
	ball: {
		style: {
			'stroke': strokeFrom(skin, 0),
			'stroke-width': 1.8,
			'fill': fillFrom(skin),
		},
	},
	liftAngle: Math.PI * 0.07,
	components: {
		'hair': {
			style: {
				'stroke': strokeFrom(hair, 0.6),
				'stroke-width': 2.2,
				'fill': fillFrom(hair),
			},
			backRendering: false,
			closed: true,
			points: pts(hairData(hairStyle).surface),
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
		'raised-hair-back': {
			style: {
				'stroke': fillFrom(hair),
				'stroke-width': hairData(hairStyle).raisedRadius - 2.2,
			},
			flat: false,
			frontRendering: false,
			points: pts(hairData(hairStyle).raised),
		},
		'raised-hair-outline': {
			style: {
				'stroke': strokeFrom(hair, 0.6),
				'stroke-width': hairData(hairStyle).raisedRadius + 2.2,
			},
			flat: false,
			points: pts(hairData(hairStyle).raised),
		},
		'raised-hair-front': {
			style: {
				'stroke': fillFrom(hair),
				'stroke-width': hairData(hairStyle).raisedRadius - 2.2,
			},
			flat: false,
			backRendering: false,
			points: pts(hairData(hairStyle).raised),
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
});

// Wrap in function to allow instantiation via New
function Doe(options) {
	return makeFace(options);
}

const NORTH_EUROPEAN_PALE = '#FFF4D1';
const NORTH_EUROPEAN_DARK = '#FDE8AA';
const WEST_AFRICAN_PALE = '#8C5822';
const WEST_AFRICAN_DARK = '#281824';

Doe.skin = function({
	european = 0,
	african = 0,
	pale = 0,
}) {
	return blendColours(
		blendColours(NORTH_EUROPEAN_DARK, NORTH_EUROPEAN_PALE, pale),
		blendColours(WEST_AFRICAN_DARK, WEST_AFRICAN_PALE, pale),
		african / (european + african),
	);
};

Doe.HAIR = {
	BLONDE: '#F2C354',
	BLACK: {
		fill: '#281C11',
		stroke: '#000000',
	},
	BROWN: {
		fill: '#996633',
		stroke: '#664422',
	},
	DARK_BLONDE: {
		fill: '#C69F45',
		stroke: '#695320',
	},
	PURPLE: '#CC3366',
	WHITE: {
		fill: '#EEE8E0',
		stroke: '#666666',
	},
};

Doe.HAIR_STYLE = HAIR_STYLES;

export default Doe;
