import {svgPt, fx} from './svgBallRendering.js';

const NS = 'http://www.w3.org/2000/svg';

function applyMat(v, m) {
	return {
		x: v.x * m[0] + v.y * m[1] + v.z * m[2],
		y: v.x * m[3] + v.y * m[4] + v.z * m[5],
		z: v.x * m[6] + v.y * m[7] + v.z * m[8],
	};
}

export function buildHat(dom, root) {
	const elBrimBackFill = dom.el('path', NS);
	const elBrimBackOutline = dom.el('path', NS);
	const elSides = dom.el('path', NS);
	const elBrimFrontFill = dom.el('path', NS);
	const elBrimFrontOutline = dom.el('path', NS);
	const elTop = dom.el('path', NS);
	root.unshift(elBrimBackFill, elBrimBackOutline);
	root.add(elSides, elBrimFrontFill, elBrimFrontOutline, elTop);
	return {
		elBrimBackFill,
		elBrimBackOutline,
		elBrimFrontFill,
		elBrimFrontOutline,
		elSides,
		elTop,
	};
}

function ellipsePoints(centre, angle, r1, r2, angles) {
	const ss = Math.sin(angle);
	const cc = Math.cos(angle);

	return angles.map((angle) => {
		const flat = {x: Math.cos(angle) * r1, y: Math.sin(angle) * r2};
		return {
			x: centre.x + cc * flat.x - ss * flat.y,
			y: centre.y + ss * flat.x + cc * flat.y,
		};
	});
}

function svgEllipseSegment(centre, angle, r1, r2, beginAngle, endAngle, cw) {
	const [p1, p2] = ellipsePoints(centre, angle, r1, r2, [beginAngle, endAngle]);
	const angleDeg = fx(angle * 180 / Math.PI);
	cw ^= (r1 < 0) ^ (r2 < 0);
	const large = Math.abs(endAngle - beginAngle) > Math.PI;

	if (Math.abs(r1) < 0.1 || Math.abs(r2) < 0.1) {
		return `${svgPt(p1)}L${svgPt(p2)}`;
	}
	return `${svgPt(p1)}A${fx(r1)} ${fx(r2)} ${angleDeg} ${large ? '1' : '0'} ${cw ? '1' : '0'} ${svgPt(p2)}`;
}

function svgEllipse(centre, angle, r1, r2) {
	const [p1, p2] = ellipsePoints(centre, angle, r1, r2, [0, Math.PI]);
	if (Math.abs(r1) < 0.1 || Math.abs(r2) < 0.1) {
		return `${svgPt(p1)}L${svgPt(p2)}L${svgPt(p1)}`;
	}
	const angleDeg = fx(angle * 180 / Math.PI);
	const arc = `A${fx(r1)} ${fx(r2)} ${angleDeg} 0 0 `;
	return `${svgPt(p1)}${arc}${svgPt(p2)}${arc}${svgPt(p1)}`;
}

export function renderHat(
	{brim, sides, top},
	mat,
	radius,
	{
		elBrimBackFill,
		elBrimBackOutline,
		elBrimFrontFill,
		elBrimFrontOutline,
		elSides,
		elTop,
	}
) {
	const dir = applyMat({x: 0, y: 1 / radius, z: 0}, mat);
	const pB = applyMat({x: 0, y: brim.y, z: 0}, mat); // dir * brim.y * radius
	const pT = applyMat({x: 0, y: top.y, z: 0}, mat); // dir * top.y * radius
	const dirXY = Math.sqrt(1 - dir.z * dir.z);

	const angle = Math.atan2(dir.y, dir.x) + Math.PI * 0.5;
	const ss = Math.sin(angle);
	const cc = Math.cos(angle);

	const angleDeg = fx(angle * 180 / Math.PI);
	const above = (dir.z < 0);

	const r1a = top.radius * radius;
	const r1b = r1a * dir.z;

	const r2a = brim.innerRadius * radius;
	const r2b = r2a * dir.z;

	if (brim.outerRadius > brim.innerRadius) {
		const r3a = brim.outerRadius * radius;
		const r3b = r3a * dir.z;
		const dBack1 = svgEllipseSegment(pB, angle, r3a, r3b, 0, Math.PI, false);
		const dBack2 = svgEllipseSegment(pB, angle, r2a, r2b, Math.PI, 0, true);
		const dFront1 = svgEllipseSegment(pB, angle, r3a, r3b, -Math.PI, 0, false);
		const dFront2 = svgEllipseSegment(pB, angle, r2a, r2b, 0, -Math.PI, true);
		const [seamlessA, seamlessB] = ellipsePoints(pB, angle, (r2a + r3a) / 2, (r2b + r3b) / 2, [Math.PI * 0.1, Math.PI * 0.9]);
		elBrimBackOutline.attr('d', `M${dBack1}M${dBack2}`);
		elBrimFrontOutline.attr('d', `M${dFront1}M${dFront2}`);
		elBrimBackFill.attr('d', `M${dBack1}L${svgPt(seamlessB)}L${dBack2}L${svgPt(seamlessA)}Z`);
		elBrimFrontFill.attr('d', `M${dFront1}L${dFront2}Z`);
	}

	let sideD;
	const coneAngleS = (brim.innerRadius - top.radius) * (dir.z / dirXY) / (top.y - brim.y);
	if (coneAngleS <= -1.0) {
		sideD = '';
	} else if (coneAngleS >= 1.0) {
		sideD = (
			'M' + svgEllipse(pB, angle, r2a, r2b) + 'Z' +
			'M' + svgEllipse(pT, angle, r1a, r1b) + 'Z'
		);
	} else {
		const coneAngle = Math.asin(coneAngleS);
		const dBase = svgEllipseSegment(pB, angle, r2a, r2b, -coneAngle, Math.PI + coneAngle, true);
		const dTop = svgEllipseSegment(pT, angle, r1a, r1b, Math.PI + coneAngle, -coneAngle, false);
		sideD = `M${dBase}L${dTop}Z`;
	}
	elSides.attr('d', sideD);

	if (top.radius > 0) {
		if (above) {
			elTop.attr('d', 'M' + svgEllipse(pT, angle, r1a, r1b) + 'Z');
		} else {
			elTop.attr('d', '');
		}
	}
}
