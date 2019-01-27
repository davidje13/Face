import {
	backtraced,
	clonePt,
	normalisePt,
	pts,
	reflectX,
	symmetricX,
} from './helpers.mjs';
import {blendColours} from '../core/blend.mjs';

function roughY(v) {
	return v.map(clonePt).map((pt) => {
		const dy = Math.random() * 0.02 - Math.random() * 0.01;
		pt.y += dy;
		pt.d = 1;
		return pt;
	});
}

function shift(v, origin) {
	const o = normalisePt(origin);
	return v.map(clonePt).map((pt) => {
		pt.x += o.x;
		pt.y += o.y;
		if (o.z !== null) {
			pt.z += o.z;
		}
		return pt;
	});
}

const EYE_SHADOW = [
	{x: 0.05, y: -0.09, z: 0, d: 1},
	{x:-0.05, y: -0.07, z: 0, d: 1},
];

const SCAR_PARTS = [
	pts([
		[0.6, 0.5],
		[0.7, 0.2],
	]),
	pts([
		[0.55, 0.40],
		[0.70, 0.45],
	]),
	pts([
		[0.60, 0.30],
		[0.72, 0.35],
	]),
	pts([
		[0.65, 0.20],
		[0.75, 0.25],
	]),
];

function deepClone(o) {
	if (!o) {
		return o;
	}
	if (Array.isArray(o)) {
		return o.map(deepClone);
	}
	if (typeof o === 'object') {
		const r = {};
		for (const k in o) {
			if (Object.prototype.hasOwnProperty.call(o, k)) {
				r[k] = deepClone(o[k]);
			}
		}
		return r;
	}
	return o;
}

const skinColBlending = 0.7;
const hairColBlending = 0.5;
const baseSkinCol = blendColours('#FDE8AA', '#CADDA2', 1 / skinColBlending);
const baseHairCol = blendColours('#C69F45', '#B39C65', 1 / hairColBlending);

export default function(base) {
	const result = deepClone(base);
	const {ball, components, expressions} = result;

	const {
		hair,
		'left-eye': leftEye,
		'right-eye': rightEye,
		nose,
		mouth,
		...otherComponents
	} = components;

	const skinCol = blendColours(ball.style['fill'], baseSkinCol, skinColBlending);
	const hairCol = blendColours(hair.style['fill'], baseHairCol, hairColBlending);
	const shadeCol = blendColours(skinCol, '#6E9D00', 0.5);
	const mouthCol = '#77100E';
	const scarOutlineCol = '#D5CA90';
	const scarCol = '#C99B72';

	ball.style['fill'] = skinCol;
	ball.style['stroke'] = blendColours('#000000', skinCol, 0.4);

	hair.style['fill'] = hairCol;
	hair.style['stroke'] = blendColours('#000000', hairCol, 0.7);
	hair.points = pts(roughY(hair.points));

	nose.points = pts([
		[0.0, 0.2, null, 1.0],
		[0.0, 0.2, null, 1.1],
	]);

	const shades = {};
	shades['left-eye-shadow'] = {
		style: {
			'stroke': shadeCol,
			'stroke-width': 5,
		},
		points: pts(shift(reflectX(EYE_SHADOW), leftEye.points[0])),
	};

	shades['right-eye-shadow'] = {
		style: {
			'stroke': shadeCol,
			'stroke-width': 5,
		},
		points: pts(shift(EYE_SHADOW, rightEye.points[0])),
	};

	for (let i = 0; i < SCAR_PARTS.length; ++ i) {
		const points = SCAR_PARTS[i];
		shades['scar-' + i + '-outline'] = {
			points,
			style: {
				'stroke': scarOutlineCol,
				'stroke-width': 5,
			},
		};
	}
	for (let i = 0; i < SCAR_PARTS.length; ++ i) {
		const points = SCAR_PARTS[i];
		shades['scar-' + i] = {
			points,
			style: {
				'stroke': scarCol,
				'stroke-width': 2,
			},
		};
	}

	shades['mouth-shadow'] = {
		style: {
			'stroke': shadeCol,
			'stroke-width': 4,
			'fill': shadeCol,
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
	};

	mouth.style['fill'] = mouthCol;

	// Force re-order (relies on object property ordering)
	result.components = {
		...shades,
		hair,
		'left-eye': leftEye,
		'right-eye': rightEye,
		nose,
		mouth,
		...otherComponents,
	};

	expressions['smile'].components['mouth-shadow'] = {
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
	};

	expressions['smile'].components['mouth'] = {
		points: symmetricX(backtraced(pts([
			[0.00, 0.650],
			[0.20, 0.630],
			[0.30, 0.590],
			[0.36, 0.520],
		]))),
	};

	expressions['sad'].components['mouth-shadow'] = {
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
	};

	expressions['laugh'].components['mouth-shadow'] = {
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
	};

	expressions['laugh'].components['mouth'] = {
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
	};

	expressions['shock'].components['mouth-shadow'] = {
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
	};

	return result;
}
