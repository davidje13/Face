#!/usr/bin/env node

const {ArgumentParser} = require('argparse');
const Face = require('../lib/face');

const parser = new ArgumentParser({
	addHelp: true,
	description: 'Render an SVG face',
	epilog: 'Example:\nface-svg.js --padding=10 --skin=Amy',
	version: '1.0.0',
});

parser.addArgument(['-p', '--padding'], {
	defaultValue: 20,
	help: 'Set the padding around the face in units',
	type: Number,
});

parser.addArgument(['-r', '--radius'], {
	defaultValue: 40,
	help: 'Set the radius of the face in units',
	type: Number,
});

parser.addArgument(['-x', '--rotate-x'], {
	defaultValue: 0,
	help: 'Set the left/right rotation of the face in degrees',
	type: Number,
});

parser.addArgument(['-y', '--rotate-y'], {
	defaultValue: 0,
	help: 'Set the up/down rotation of the face in degrees',
	type: Number,
});

parser.addArgument(['-s', '--skin'], {
	defaultValue: 'Clyde',
	help: `Set the skin to render (${Object.keys(Face.skins).join(' / ')})`,
	type: String,
});

parser.addArgument(['-e', '--expression'], {
	defaultValue: 'normal',
	help: 'Set the expression to render',
	type: String,
});

parser.addArgument(['-z', '--zoom'], {
	defaultValue: 1,
	help: 'Set the zoom ratio',
	type: Number,
});

const args = parser.parseArgs();

const {padding, radius, rotate_x, rotate_y, skin, expression, zoom} = args;

function rad(deg) {
	return deg * Math.PI / 180;
}

function processError(err) {
	if (typeof err === 'object' && err.message) {
		return err.message;
	} else {
		return err;
	}
}

try {
	const config = {
		expressions: {[expression]: 1},
		padding,
		radius,
		rotation: {x: rad(rotate_x), y: rad(rotate_y)},
		skin,
		zoom,
	};

	process.stdout.write(Face.render(config) + '\n');
} catch (err) {
	process.stderr.write(processError(err) + '\n');
}
