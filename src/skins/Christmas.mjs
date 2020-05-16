import {
	MOUTH_LAUGH,
	MOUTH_NORMAL,
	MOUTH_SAD,
	MOUTH_SHOCK,
	MOUTH_SMILE,
} from './Doe.mjs';
import {pts, reflectX} from './helpers.mjs';

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

const EYE = pts([[0.25, -0.05], [0.25, -0.02]]);

const CHEEK_STYLE = {
	'stroke': '#F7D1AF',
	'stroke-width': 5,
	'opacity': 1,
};

const CHEEK = pts([[0.29, 0.08]]);

const HAIR_STYLE = {
	'stroke': '#202020',
	'stroke-width': 3,
	'fill': '#FFFFFF',
};

const MOUSTACHE_NEUTRAL = pts([
	[0.06, 0.47],
	[0.13, 0.38],
	[0.21, 0.33, null, 1.02],
	[0.31, 0.33, null, 1.02],
	[0.48, 0.33, null, 1.02],
	[0.61, 0.34, null, 1.05],
	[0.52, 0.45, null, 1.02],
	[0.39, 0.53],
	[0.25, 0.57],
	[0.16, 0.58],
	[0.06, 0.55],
]);

const MOUSTACHE_SMILE = pts([
	[0.06, 0.47],
	[0.13, 0.38],
	[0.21, 0.33, null, 1.02],
	[0.33, 0.31, null, 1.02],
	[0.49, 0.29, null, 1.02],
	[0.62, 0.29, null, 1.05],
	[0.53, 0.43, null, 1.02],
	[0.39, 0.52],
	[0.26, 0.56],
	[0.16, 0.58],
	[0.06, 0.55],
]);

const MOUSTACHE_SAD = pts([
	[0.06, 0.47],
	[0.13, 0.38],
	[0.21, 0.33, null, 1.02],
	[0.31, 0.33, null, 1.02],
	[0.48, 0.33, null, 1.02],
	[0.61, 0.34, null, 1.05],
	[0.52, 0.45, null, 1.02],
	[0.39, 0.53],
	[0.25, 0.57],
	[0.16, 0.58],
	[0.06, 0.55],
]);

const MOUSTACHE_LAUGH = pts([
	[0.06, 0.47],
	[0.13, 0.38],
	[0.21, 0.33, null, 1.02],
	[0.32, 0.28, null, 1.02],
	[0.45, 0.24, null, 1.02],
	[0.57, 0.25, null, 1.05],
	[0.52, 0.39, null, 1.02],
	[0.39, 0.49],
	[0.26, 0.55],
	[0.16, 0.58],
	[0.06, 0.55],
]);

const MOUSTACHE_SHOCK = pts([
	[0.06, 0.47],
	[0.13, 0.38],
	[0.21, 0.33, null, 1.02],
	[0.31, 0.33, null, 1.02],
	[0.48, 0.33, null, 1.02],
	[0.61, 0.34, null, 1.05],
	[0.52, 0.45, null, 1.02],
	[0.39, 0.53],
	[0.25, 0.57],
	[0.16, 0.58],
	[0.06, 0.55],
]);

const hat = {
	brim: {
		y: -0.6,
	},
	sides: {
		style: {
			'stroke': '#560F06',
			'stroke-width': 3,
			'fill': '#EF3A22',
		},
	},
	top: {
		y: -1.9,
		radius: 0,
	},
};

function makeRing(y, rad, count) {
	const ring = [];
	for (let i = 0; i < count; ++ i) {
		const theta = i * Math.PI * 2 / count;
		ring.push([Math.cos(theta) * rad, y, Math.sin(theta) * rad]);
	}
	return ring;
}

const NS = 'http://www.w3.org/2000/svg';

function makeFluffBlob(symbol, dom) {
	const path = dom.el('circle', NS).attrs({
		'stroke': '#DDDDDD',
		'stroke-width': 1,
		'fill': '#FFFFFF',
		'cx': '0',
		'cy': '0',
		'r': '5',
	});
	symbol.add(path);
}

export default {
	ball: {
		style: {
			'fill': '#F7D1AF',
		},
	},
	liftAngle: Math.PI * 0.1,
	hat,
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
			backRendering: false,
			points: reflectX(CHEEK),
		},
		'right-cheek': {
			style: CHEEK_STYLE,
			backRendering: false,
			points: CHEEK,
		},
		'forced-outline': {
			style: {
				'stroke': '#000000',
				'stroke-width': 3,
				'fill': 'rgba(0,0,0,0)', // Force outlining as if filled
			},
			closed: true,
			// Arbitrary shape at back to force rendering outline above cheeks
			points: pts([
				[ 0.0,-0.1, true],
				[ 0.1, 0.1, true],
				[-0.1, 0.1, true],
			]),
		},
		'hair': {
			style: HAIR_STYLE,
			closed: true,
			points: pts([
				[ 0.09, 0.88],
				[ 0.24, 0.83],
				[ 0.36, 0.75],
				[ 0.46, 0.66],
				[ 0.51, 0.52],
				[ 0.53, 0.37],
				[ 0.49, 0.24],
				[ 0.51, 0.14],
				[ 0.48, 0.03],
				[ 0.48,-0.08],
				[ 0.44,-0.18],
				[ 0.36,-0.27],
				[ 0.27,-0.35],
				[ 0.14,-0.40],
				[ 0.01,-0.40],
				[-0.13,-0.36],
				[-0.24,-0.33],
				[-0.35,-0.29],
				[-0.41,-0.22],
				[-0.45,-0.16],
				[-0.52,-0.08],
				[-0.52, 0.04],
				[-0.50, 0.17],
				[-0.51, 0.32],
				[-0.52, 0.45],
				[-0.54, 0.56],
				[-0.50, 0.67],
				[-0.38, 0.78],
				[-0.25, 0.86],
				[-0.09, 0.90],
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
		'beard': {
			style: HAIR_STYLE,
			flat: false,
			closed: true,
			points: pts([
				[ 0.12, 0.67],
				[ 0.25, 0.62],
				[ 0.31, 0.59],
				[ 0.46, 0.54],
				[ 0.54, 0.65],
				[ 0.54, 0.65],
				[ 0.34, 0.90, null, 1.1],
				[ 0.00, 0.98, null, 1.1],
				[-0.29, 0.93, null, 1.1],
				[-0.51, 0.83],
				[-0.61, 0.62],
				[-0.55, 0.51],
				[-0.37, 0.54],
				[-0.22, 0.63],
				[-0.08, 0.67],
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
				[0.0, 0.2, null, 1.0],
				[0.0, 0.4, null, 1.15],
				[0.0, 0.5, null, 1.0],
			]),
		},
		'fluff': {
			blob: makeFluffBlob,
			points: pts([
				...makeRing(
					hat.brim.y,
					Math.sqrt(1 - hat.brim.y * hat.brim.y) * 1.1,
					20,
				),
				[0, hat.top.y, 0],
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
					points: pts([
						[ 0.15, 0.64],
						[ 0.31, 0.55],
						[ 0.39, 0.46],
						[ 0.55, 0.48],
						[ 0.57, 0.63],
						[ 0.53, 0.79],
						[ 0.34, 0.88, null, 1.1],
						[-0.01, 0.96, null, 1.1],
						[-0.33, 0.91, null, 1.1],
						[-0.53, 0.81],
						[-0.61, 0.62],
						[-0.60, 0.47],
						[-0.45, 0.46],
						[-0.30, 0.60],
						[-0.08, 0.67],
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
					points: MOUTH_SAD,
				},
				'beard': {
					points: pts([
						[ 0.10, 0.61],
						[ 0.22, 0.64],
						[ 0.28, 0.64],
						[ 0.41, 0.55],
						[ 0.53, 0.55],
						[ 0.54, 0.65],
						[ 0.34, 0.90, null, 1.1],
						[ 0.00, 0.98, null, 1.1],
						[-0.29, 0.93, null, 1.1],
						[-0.51, 0.83],
						[-0.61, 0.62],
						[-0.55, 0.53],
						[-0.41, 0.55],
						[-0.26, 0.63],
						[-0.08, 0.60],
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
					points: MOUTH_LAUGH,
				},
				'beard': {
					points: pts([
						[ 0.08, 0.75],
						[ 0.24, 0.67],
						[ 0.31, 0.57],
						[ 0.46, 0.54],
						[ 0.56, 0.58],
						[ 0.56, 0.69],
						[ 0.34, 0.90, null, 1.1],
						[ 0.00, 0.98, null, 1.1],
						[-0.29, 0.93, null, 1.1],
						[-0.51, 0.83],
						[-0.61, 0.62],
						[-0.55, 0.51],
						[-0.37, 0.54],
						[-0.23, 0.69],
						[-0.10, 0.75],
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
					points: MOUTH_SHOCK,
				},
				'beard': {
					points: pts([
						[ 0.08, 0.75],
						[ 0.24, 0.67],
						[ 0.31, 0.57],
						[ 0.46, 0.54],
						[ 0.56, 0.58],
						[ 0.56, 0.69],
						[ 0.34, 0.90, null, 1.1],
						[ 0.00, 0.98, null, 1.1],
						[-0.29, 0.93, null, 1.1],
						[-0.51, 0.83],
						[-0.61, 0.62],
						[-0.55, 0.51],
						[-0.37, 0.54],
						[-0.23, 0.69],
						[-0.10, 0.75],
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
