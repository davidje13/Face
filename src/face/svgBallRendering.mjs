// Expects points defined in clockwise order (always fills on the right)

function len2({x, y}) {
	return Math.sqrt(x * x + y * y);
}

function len3({x, y, z}) {
	return Math.sqrt(x * x + y * y + z * z);
}

function pointVisible(pt) {
	return pt.z > 0;
}

const TRAILING_STRIP = /^(-?[0-9]+)(?:\.|(\..+?))0*$/;

export function fx(v) {
	return v.toFixed(5);
}

export function fxShort(v) {
	const fxv = fx(v);
	const r = TRAILING_STRIP.exec(fxv);
	if (!r) {
		return fxv;
	}
	return r[1] + (r[2] || '');
}

function polylineDirection(pts) {
	// Thanks, https://stackoverflow.com/a/1165943/1180785
	if (pts.length <= 1) {
		return 0;
	}

	let sum = 0;
	for (let i = 0; i < pts.length - 1; ++ i) {
		const p1 = pts[i];
		const p2 = pts[i + 1];
		sum += (p2.x - p1.x) * (p2.y + p1.y);
	}
	const p1 = pts[pts.length - 1];
	const p2 = pts[0];
	sum += (p2.x - p1.x) * (p2.y + p1.y);
	return (sum > 1e-6) ? 1 : (sum < -1e-6) ? -1 : 0;
}

function greatCircleEdge(p1, p2, radius) {
	const cross = {
		x: p1.y * p2.z - p1.z * p2.y,
		y: p1.z * p2.x - p1.x * p2.z,
	};
	const m = radius * ((p1.z > p2.z) ? 1 : -1) / len2(cross);
	return {
		x: cross.y * m,
		y: -cross.x * m,
		z: 0.0,
	};
}

export function svgPt({x, y}) {
	return `${fx(x)} ${fx(y)}`;
}

function svgGreatCircle(p1, p2, radius, fxr) {
	if (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z) {
		return '';
	}
	const cross = {
		x: p1.y * p2.z - p1.z * p2.y,
		y: p1.z * p2.x - p1.x * p2.z,
		z: p1.x * p2.y - p1.y * p2.x,
	};
	const angle = Math.atan2(cross.y, cross.x);
	const r2 = radius * cross.z / len3(cross);
	return `A${fx(r2)} ${fxr} ${fx(angle * 180 / Math.PI)} 0 ${(cross.z > 0) ? '1' : '0'} ${svgPt(p2)}`;
}

function svgArcAlongCircumference(p1, p2, fxr, clockwise = false) {
	const dir = (p1.x * p2.y - p1.y * p2.x) < 0;
	const short = (dir !== clockwise);
	return `A${fxr} ${fxr} 0 ${short ? '0' : '1'} ${clockwise ? '1' : '0'} `;
}

function svgCircle(fxr) {
	return `M0 ${fxr}A${fxr} ${fxr} 0 0 0 0 -${fxr}A${fxr} ${fxr} 0 0 0 0 ${fxr}Z`;
}

function pathBall(pts, radius, fxr, pointsAsLines) {
	let previous = pts[0];
	let result = svgPt(previous);
	for (let i = 1; i < pts.length; ++ i) {
		const pt = pts[i];
		result += svgGreatCircle(previous, pt, radius, fxr);
		previous = pt;
	}
	if (pts.length === 1 && pointsAsLines) {
		result += 'l0 0.0001';
	}
	return result;
}

function divideVisibleSections(pts, closed, radius) {
	let begin = 0;
	for (let i = 1; i < pts.length; ++ i) {
		if (pts[i - 1].z <= 0 && pts[i].z > 0) {
			begin = i;
			break;
		}
	}
	const all = [];
	let current = null;
	let prev = pts[(begin + pts.length - 1) % pts.length];
	for (let i = 0; i < pts.length; ++ i) {
		const index = (begin + i) % pts.length;
		const cur = pts[index];
		if (cur.z > 0) {
			if (prev.z <= 0) {
				// Start of path
				current = {endIsEdge: false, path: [], startIsEdge: false};
				if (index > 0 || closed) {
					current.startIsEdge = true;
					current.path.push(greatCircleEdge(prev, cur, radius));
				}
			}
			current.path.push(cur);
		} else if (prev.z > 0) {
			// End of path
			if (index > 0 || closed) {
				current.endIsEdge = true;
				current.path.push(greatCircleEdge(prev, cur, radius));
			}
			all.push(current);
			current = null;
		}
		prev = cur;
	}
	if (current !== null) {
		all.push(current);
	}
	return all;
}

function joinSections(paths, fxr, clockwise) {
	for (let i = 0; i < paths.length;) {
		const path1 = paths[i];
		const angle1 = path1.endAngle;
		if (angle1 === null) {
			++ i;
			continue;
		}
		let minAngle = Math.PI * 4;
		let choiceJ = -1;
		for (let j = 0; j < paths.length; ++ j) {
			const path2 = paths[j];
			const angle2 = path2.startAngle;
			if (angle2 === null) {
				continue;
			}
			let angleDiff = (angle2 - angle1) * (clockwise ? 1 : -1);
			angleDiff = (angleDiff + Math.PI * 4) % (Math.PI * 2);
			if (angleDiff < minAngle) {
				minAngle = angleDiff;
				choiceJ = j;
			}
		}
		if (choiceJ === -1) {
			break; // No start angles left; nothing more to join
		}
		const path2 = paths[choiceJ];
		path1.d += svgArcAlongCircumference(path1.end, path2.start, fxr, clockwise);
		if (choiceJ === i) {
			path1.d += svgPt(path2.start);
			path1.startAngle = null;
			path1.endAngle = null;
			path1.d += 'Z';
			++ i;
		} else {
			path1.d += path2.d;
			path1.end = path2.end;
			path1.endAngle = path2.endAngle;
			paths.splice(choiceJ, 1);
			// No need to change iterator here, even if j < i
		}
	}
}

export function renderLines(pts, {closed = false} = {}) {
	return 'M' + pts.map(svgPt).join('L') + (closed ? 'Z' : '');
}

export function renderOnBall(pts, {radius, filled = false, closed = false, pointsAsLines = false}) {
	let result = '';
	const fxr = fxShort(radius);

	if (!pts.some(pointVisible)) {
		// Entire path is on back of sphere, or path is empty
		if (filled && polylineDirection(pts) < 0) {
			result += svgCircle(fxr);
		}
	} else if (pts.every(pointVisible)) {
		// Entire path is visible
		const path = (closed && pts.length > 1) ? [...pts, pts[0]] : pts;
		result += 'M' + pathBall(path, radius, fxr, pointsAsLines);
		if (closed || pts.length === 1) {
			result += 'Z';
		}
		if (filled && polylineDirection(pts) > 0) {
			result += svgCircle(fxr);
		}
	} else {
		// Path is partially visible
		const paths = divideVisibleSections(pts, closed, radius)
			.map(({path, startIsEdge, endIsEdge}) => {
				const start = path[0];
				const end = path[path.length - 1];
				return {
					d: pathBall(path, radius, fxr, pointsAsLines),
					end,
					endAngle: endIsEdge ? Math.atan2(end.y, end.x) : null,
					start,
					startAngle: startIsEdge ? Math.atan2(start.y, start.x) : null,
				};
			});

		if (filled) {
			// Join segments in clockwise order
			joinSections(paths, fxr, true);
		}

		result += paths.map(({d}) => 'M' + d).join('');
	}

	return result;
}
