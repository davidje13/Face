/* eslint-disable sort-keys */

const TRANSPARENT = {r: 0, g: 0, b: 0, a: 0};

function readColPart(full, partSize, index, def = 0) {
	if (full.length < 1 + (index + 1) * partSize) {
		return def;
	}
	const p = full.substr(1 + index * partSize, partSize);
	const v = Number.parseInt(p, 16);
	if (p.length === 1) {
		return v * 0x11;
	} else {
		return v;
	}
}

function readCol(css) {
	if (css === 'none') {
		return TRANSPARENT;
	}
	if (css.charAt(0) === '#') {
		const partSize = (css.length > 5) ? 2 : 1;
		return {
			r: readColPart(css, partSize, 0),
			g: readColPart(css, partSize, 1),
			b: readColPart(css, partSize, 2),
			a: readColPart(css, partSize, 3, 255),
		};
	}
	if (css.startsWith('rgb')) {
		const inner = css.substring(
			css.indexOf('(') + 1,
			css.lastIndexOf(')'),
		);
		const raw = inner.split(',').map((v) => Number.parseInt(v, 10));
		return {
			r: raw[0],
			g: raw[1],
			b: raw[2],
			a: raw.length >= 4 ? raw[3] : 255,
		};
	}
	return TRANSPARENT;
}

function writeCol({r, g, b, a}) {
	return (
		'rgba(' +
		Math.round(r) + ',' +
		Math.round(g) + ',' +
		Math.round(b) + ',' +
		Math.round(a) + ')'
	);
}

export function blendColours(col1, col2, p) {
	if (p === 0) {
		return col1;
	} else if (p === 1) {
		return col2;
	}
	const c1 = readCol(col1);
	const c2 = readCol(col2);
	const q = 1 - p;
	const a = c1.a * q + c2.a * p;
	if (a === 0) {
		return 'rgba(0,0,0,0)';
	}
	return writeCol({
		r: (c1.r * c1.a * q + c2.r * c2.a * p) / a,
		g: (c1.g * c1.a * q + c2.g * c2.a * p) / a,
		b: (c1.b * c1.a * q + c2.b * c2.a * p) / a,
		a,
	});
}

/* eslint-enable sort-keys */
