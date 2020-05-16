#!/usr/bin/env node

const Face = require('../lib/face');
const buffer2stream = require('buffer-to-stream');
const fs = require('fs');
const PngCrush = require('pngcrush');
const svg2png = require('svg2png');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

function processError(err) {
	if (typeof err === 'object' && err.message) {
		return err.message;
	} else {
		return err;
	}
}

function stream2buffer(stream) {
	return new Promise((resolve) => {
		// Thanks, https://stackoverflow.com/a/14269536/1180785
		const bufs = [];
		stream.on('data', (d) => bufs.push(d));
		stream.on('end', () => resolve(Buffer.concat(bufs)));
	});
}

function compressImageBuffer(buffer) {
	const compressed = buffer2stream(buffer)
		.pipe(new PngCrush(['-rem', 'allb', '-brute', '-l', '9']));
	return stream2buffer(compressed);
}

function renderSample({file, options, size}) {
	process.stdout.write('generating ' + file + '\n');

	// Work around a bug in old Chrome rendering engine used by svg2png
	const opts = Object.assign({pointsAsLines: true}, options);

	return Promise.resolve(Face.render(opts))
		.then((svg) => svg2png(svg, size))
		.then(compressImageBuffer)
		.then((buffer) => writeFile(file, buffer, {mode: 0o644}))
		.then(() => process.stdout.write(file + ' complete\n'))
		.catch((err) => process.stderr.write(
			'Failed to generate ' + file + ': ' +
			processError(err) + '\n',
		));
}

const samples = [
	{
		file: 'resources/favicon.png',
		options: {
			expressions: {'laugh': 1},
			padding: 5.0,
			radius: 40.0,
			rotation: {x: Math.PI * 0.12, y: Math.PI * 0.03},
			skin: Face.skins.Clyde,
		},
		size: {height: 64, width: 64},
	},
	{
		file: 'screenshots/face.png',
		options: {
			expressions: {'smile': 1},
			padding: 5.0,
			radius: 40.0,
			rotation: {x: -Math.PI * 0.14, y: -Math.PI * 0.02},
			skin: Face.skins.Clyde,
		},
		size: {height: 400, width: 400},
	},
];

for (const skin in Face.skins) {
	if (!Object.prototype.hasOwnProperty.call(Face.skins, skin)) {
		continue;
	}

	if (typeof Face.skins[skin] !== 'object') {
		continue;
	}

	samples.push({
		file: `screenshots/${skin}.png`,
		options: {
			expressions: {'laugh': 1},
			padding: 25.0,
			radius: 40.0,
			rotation: {x: 0, y: 0},
			shift: {x: 0, y: 15},
			skin,
		},
		size: {height: 300, width: 300},
	});
}

Promise.all(samples.map(renderSample))
	.then(() => process.stdout.write('done.\n'))
	.catch((err) => process.stderr.write(processError(err) + '\n'));
