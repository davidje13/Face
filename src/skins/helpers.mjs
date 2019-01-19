function normalisePt(v) {
	if (Array.isArray(v)) {
		let [x, y, z = null, d = null] = v;
		let back = false;
		if (typeof z === 'boolean') {
			back = z;
			z = null;
		} else if (typeof d === 'boolean') {
			back = d;
			d = null;
		}
		return {x, y, z, d, back};
	} else {
		return v;
	}
}

export function pt(v) {
	let {x, y, z = null, d = null, back = false} = normalisePt(v);
	if (z === null) {
		z = Math.sqrt(1 - x * x - y * y);
		if (Number.isNaN(z)) {
			z = 0;
		} else if (back) {
			z *= -1;
		}
		if (d === null) {
			d = 1;
		}
	}
	if (d !== null) {
		const m = d / Math.sqrt(x * x + y * y + z * z);
		x *= m;
		y *= m;
		z *= m;
	}
	return {x, y, z};
}

export function pts(v) {
	return v.map(pt);
}

export function symmetricX(v) {
	const all = v.slice();
	for (let i = v.length; (i --) > 0;) {
		const p = Object.assign({}, v[i]);
		p.x = -p.x;
		if ((i === 0 || i === v.length - 1) && p.x === 0) {
			continue;
		}
		all.push(p);
	}
	return all;
}

export function reflectX(v) {
	const all = [];
	for (let i = v.length; (i --) > 0;) {
		const p = Object.assign({}, v[i]);
		p.x = -p.x;
		all.push(p);
	}
	return all;
}

export function backtraced(v) {
	const all = v.slice();
	for (let i = v.length - 1; (i --) > 0;) {
		all.push(v[i]);
	}
	return all;
}
