import {HAIR_RAW, MOUTH_NORMAL, MOUTH_SAD, MOUTH_SHOCK} from './Clyde.mjs';
import {backtraced, pts, reflectX, symmetricX} from './helpers.mjs';

function roughY(v) {
	for (const pt of v) {
		const dy = Math.random() * 0.02 - Math.random() * 0.01;
		if (Array.isArray(pt)) {
			pt[1] += dy;
		} else {
			pt.y += dy;
		}
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

const EYE = pts([[0.3, -0.05], [0.3, -0.02]]);

const EYE_SHADOW_STYLE = {
	'stroke': '#9CBD51',
	'stroke-width': 5,
};

const EYE_SHADOW = pts([
	[0.35, -0.14],
	[0.25, -0.12],
]);

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
			points: symmetricX(pts(roughY(HAIR_RAW))),
		},
		'left-eye-shadow': {
			style: EYE_SHADOW_STYLE,
			points: reflectX(EYE_SHADOW),
		},
		'right-eye-shadow': {
			style: EYE_SHADOW_STYLE,
			points: EYE_SHADOW,
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
				[0.6, 0.5],
				[0.7, 0.2],
			]),
		},
		'right-cheek-scar-shade-stitch-1': {
			style: SCAR_BACK_STYLE,
			points: pts([
				[0.55, 0.40],
				[0.70, 0.45],
			]),
		},
		'right-cheek-scar-shade-stitch-2': {
			style: SCAR_BACK_STYLE,
			points: pts([
				[0.60, 0.30],
				[0.72, 0.35],
			]),
		},
		'right-cheek-scar-shade-stitch-3': {
			style: SCAR_BACK_STYLE,
			points: pts([
				[0.65, 0.20],
				[0.75, 0.25],
			]),
		},
		'right-cheek-scar': {
			style: SCAR_STYLE,
			points: pts([
				[0.6, 0.5],
				[0.7, 0.2],
			]),
		},
		'right-cheek-scar-stitch-1': {
			style: SCAR_STYLE,
			points: pts([
				[0.55, 0.40],
				[0.70, 0.45],
			]),
		},
		'right-cheek-scar-stitch-2': {
			style: SCAR_STYLE,
			points: pts([
				[0.60, 0.30],
				[0.72, 0.35],
			]),
		},
		'right-cheek-scar-stitch-3': {
			style: SCAR_STYLE,
			points: pts([
				[0.65, 0.20],
				[0.75, 0.25],
			]),
		},
		'nose': {
			style: {
				'stroke': '#000000',
				'stroke-width': 5,
			},
			flat: false,
			points: pts([
				[0.0, 0.2, null, 1.0],
				[0.0, 0.2, null, 1.1],
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
				[ 0.00, 0.47],
				[ 0.10, 0.48],
				[ 0.20, 0.50],
				[ 0.35, 0.60],
				[ 0.30, 0.75],
				[ 0.20, 0.85],
				[ 0.10, 0.80],
				[ 0.00, 0.90],
				[-0.10, 0.80],
				[-0.20, 0.75],
				[-0.30, 0.67],
				[-0.35, 0.60],
				[-0.20, 0.50],
				[-0.10, 0.48],
			]),
		},
		'mouth': {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
				'fill': '#77100E',
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
				'mouth-shadow': {
					points: pts([
						[ 0.00, 0.45],
						[ 0.10, 0.44],
						[ 0.30, 0.44],
						[ 0.40, 0.46],
						[ 0.30, 0.75],
						[ 0.20, 0.85],
						[ 0.10, 0.80],
						[ 0.00, 0.90],
						[-0.10, 0.80],
						[-0.20, 0.75],
						[-0.30, 0.67],
						[-0.40, 0.46],
						[-0.30, 0.44],
						[-0.10, 0.44],
					]),
				},
				'mouth': {
					points: symmetricX(backtraced(pts([
						[0.00, 0.650],
						[0.20, 0.630],
						[0.30, 0.590],
						[0.36, 0.520],
					]))),
				},
			},
		},
		'sad': {
			components: {
				'mouth-shadow': {
					points: pts([
						[ 0.00, 0.47],
						[ 0.10, 0.48],
						[ 0.20, 0.55],
						[ 0.35, 0.65],
						[ 0.30, 0.75],
						[ 0.20, 0.85],
						[ 0.10, 0.80],
						[ 0.00, 0.90],
						[-0.10, 0.80],
						[-0.20, 0.75],
						[-0.30, 0.67],
						[-0.35, 0.65],
						[-0.20, 0.55],
						[-0.10, 0.48],
					]),
				},
				'mouth': {
					points: MOUTH_SAD,
				},
			},
		},
		'laugh': {
			components: {
				'mouth-shadow': {
					points: pts([
						[ 0.00, 0.47],
						[ 0.10, 0.48],
						[ 0.20, 0.50],
						[ 0.35, 0.60],
						[ 0.30, 0.75],
						[ 0.20, 0.85],
						[ 0.10, 0.80],
						[ 0.00, 0.90],
						[-0.10, 0.80],
						[-0.20, 0.75],
						[-0.30, 0.67],
						[-0.35, 0.60],
						[-0.20, 0.50],
						[-0.10, 0.48],
					]),
				},
				'mouth': {
					points: pts([
						[ 0.00, 0.600],
						[ 0.20, 0.600],
						[ 0.25, 0.610],
						[ 0.30, 0.650],
						[ 0.20, 0.700],
						[ 0.10, 0.720],
						[ 0.00, 0.730],
						[-0.10, 0.720],
						[-0.20, 0.700],
						[-0.30, 0.650],
						[-0.25, 0.620],
						[-0.20, 0.610],
					]),
				},
			},
		},
		'shock': {
			components: {
				'mouth-shadow': {
					points: pts([
						[ 0.00, 0.47],
						[ 0.10, 0.48],
						[ 0.20, 0.50],
						[ 0.35, 0.60],
						[ 0.30, 0.75],
						[ 0.20, 0.85],
						[ 0.10, 0.80],
						[ 0.00, 0.90],
						[-0.10, 0.80],
						[-0.20, 0.75],
						[-0.30, 0.67],
						[-0.35, 0.60],
						[-0.20, 0.50],
						[-0.10, 0.48],
					]),
				},
				'mouth': {
					points: MOUTH_SHOCK,
				},
			},
		},
	},
};
