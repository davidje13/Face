import {pts, symmetricX, backtraced} from './helpers.js';

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
			style: {
				'stroke': '#000080',
				'stroke-width': 2,
				'fill': '#0000FF',
				'opacity': 0.3,
			},
			closed: true,
			points: pts([
				{x: 0, y: 0, z: 1},
				{x: 0, y: 1, z: 0},
				{x: 0, y: 0, z:-1},
				{x: 0, y:-1, z: 0},
			]),
		},
		'yBottom': {
			style: {
				'stroke': '#800000',
				'stroke-width': 2,
				'fill': '#FF0000',
				'opacity': 0.3,
			},
			closed: true,
			points: pts([
				{x: 0, y: 0, z: 1},
				{x: 1, y: 0, z: 0},
				{x: 0, y: 0, z:-1},
				{x:-1, y: 0, z: 0},
			]),
		},
		'zBack': {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
				'fill': '#000000',
				'opacity': 0.3,
			},
			closed: true,
			points: pts([
				{x: 0, y:-1, z: 0},
				{x:-1, y: 0, z: 0},
				{x: 0, y: 1, z: 0},
				{x: 1, y: 0, z: 0},
			]),
		},
		'fInnerDown': {
			style: {
				'stroke': '#008000',
				'stroke-width': 3,
				'fill': '#00FF00',
				'opacity': 0.3,
			},
			closed: true,
			points: pts([
				{x: 0.0, y:-0.5},
				{x: 0.5, y: 0.0},
				{x: 0.0, y: 0.8},
				{x:-0.5, y: 0.0},
			]),
		},
		'fOuter': {
			style: {
				'stroke': '#808000',
				'stroke-width': 3,
				'fill': '#FFFF00',
				'opacity': 0.3,
			},
			closed: true,
			points: pts([
				{x:-0.5, y:-0.5},
				{x:-0.5, y: 0.5},
				{x: 0.5, y: 0.5},
				{x: 0.5, y:-0.5},
			]),
		},
	},
};
