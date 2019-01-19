import {pts} from './helpers.mjs';

function outlineFill(outline, flood, line = 2) {
	return {
		'stroke': outline,
		'stroke-width': line,
		'fill': flood,
		'opacity': 0.3,
	};
}

export default {
	ball: {
		style: {
			'stroke': '#000000',
			'stroke-width': 1,
			'fill': '#FFFFFF',
		},
	},
	components: {
		'xRight': {
			style: outlineFill('#000080', '#0000FF'),
			closed: true,
			points: pts([
				[ 0, 0, 1],
				[ 0, 1, 0],
				[ 0, 0,-1],
				[ 0,-1, 0],
			]),
		},
		'yBottom': {
			style: outlineFill('#800000', '#FF0000'),
			closed: true,
			points: pts([
				[ 0, 0, 1],
				[ 1, 0, 0],
				[ 0, 0,-1],
				[-1, 0, 0],
			]),
		},
		'zBack': {
			style: outlineFill('#000000', '#000000'),
			closed: true,
			points: pts([
				[ 0,-1, 0],
				[-1, 0, 0],
				[ 0, 1, 0],
				[ 1, 0, 0],
			]),
		},
		'fInnerDown': {
			style: outlineFill('#008000', '#00FF00', 3),
			closed: true,
			points: pts([
				[ 0.0,-0.5],
				[ 0.5, 0.0],
				[ 0.0, 0.8],
				[-0.5, 0.0],
			]),
		},
		'fOuter': {
			style: outlineFill('#808000', '#FFFF00', 3),
			closed: true,
			points: pts([
				[-0.5,-0.5],
				[-0.5, 0.5],
				[ 0.5, 0.5],
				[ 0.5,-0.5],
			]),
		},
	},
};
