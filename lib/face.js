(function () {
	'use strict';

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

	const MIN_ARC_DIST = 5;

	const TRAILING_STRIP = /^(-?[0-9]+)(?:\.|(\..+?))0*$/;

	function fx(v) {
		return v.toFixed(5);
	}

	function fxShort(v) {
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

	function svgPt({x, y}) {
		return `${fx(x)} ${fx(y)}`;
	}

	function svgGreatCircle(p1, p2, radius, fxr) {
		if (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z) {
			return '';
		}
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const dz = p2.z - p1.z;
		if (dx * dx + dy * dy + dz * dz < MIN_ARC_DIST * MIN_ARC_DIST) {
			return 'L' + svgPt(p2);
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

	function renderLines(pts, {closed = false} = {}) {
		return 'M' + pts.map(svgPt).join('L') + (closed ? 'Z' : '');
	}

	function renderOnBall(pts, {radius, filled = false, closed = false, pointsAsLines = false}) {
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

	const NS = 'http://www.w3.org/2000/svg';

	const Pi = Math.PI;

	function posMod(a, b) {
		return ((a % b) + b) % b;
	}

	function applyMat(v, m) {
		return {
			x: v.x * m[0] + v.y * m[1] + v.z * m[2],
			y: v.x * m[3] + v.y * m[4] + v.z * m[5],
			z: v.x * m[6] + v.y * m[7] + v.z * m[8],
		};
	}

	function buildHat(dom, root) {
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

	function ellipsePoints(centre, ellipseAngle, r1, r2, angles) {
		const ss = Math.sin(ellipseAngle);
		const cc = Math.cos(ellipseAngle);

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
		if (Math.abs(r1) < 0.1 || Math.abs(r2) < 0.1) {
			return `${svgPt(p1)}L${svgPt(p2)}`;
		}
		if (cw) {
			endAngle = beginAngle + posMod(endAngle - beginAngle, Pi * 2);
		} else {
			endAngle = beginAngle + posMod(endAngle - beginAngle, Pi * 2) - Pi * 2;
		}
		const large = Math.abs(endAngle - beginAngle) > Pi;
		const angleDeg = fx(angle * 180 / Pi);
		cw ^= (r1 < 0) ^ (r2 < 0);

		return `${svgPt(p1)}A${fx(r1)} ${fx(r2)} ${angleDeg} ${large ? '1' : '0'} ${cw ? '1' : '0'} ${svgPt(p2)}`;
	}

	function svgEllipse(centre, angle, r1, r2) {
		const [p1, p2] = ellipsePoints(centre, angle, r1, r2, [0, Pi]);
		if (Math.abs(r1) < 0.1 || Math.abs(r2) < 0.1) {
			return `${svgPt(p1)}L${svgPt(p2)}L${svgPt(p1)}`;
		}
		const angleDeg = fx(angle * 180 / Pi);
		const arc = `A${fx(r1)} ${fx(r2)} ${angleDeg} 0 0 `;
		return `${svgPt(p1)}${arc}${svgPt(p2)}${arc}${svgPt(p1)}`;
	}

	function renderHat(
		{brim, top},
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
		const pB = applyMat({x: 0, y: brim.y, z: 0}, mat); // =dir * brim.y * radius
		const pT = applyMat({x: 0, y: top.y, z: 0}, mat); // =dir * top.y * radius
		const dirXY = Math.sqrt(1 - dir.z * dir.z);

		const angle = Math.atan2(dir.y, dir.x) + Pi * 0.5;

		const above = (dir.z < 0);

		const r1a = top.radius * radius;
		const r1b = r1a * dir.z;

		const r2a = brim.innerRadius * radius;
		const r2b = r2a * dir.z;

		if (brim.outerRadius > brim.innerRadius) {
			const r3a = brim.outerRadius * radius;
			const r3b = r3a * dir.z;
			const clipDist = brim.y * dir.z / dirXY;
			const surfaceRad = Math.sqrt(1 - brim.y * brim.y);
			if (Math.abs(clipDist) >= surfaceRad) {
				const d1 = svgEllipse(pB, angle, r3a, r3b);
				const d2 = svgEllipse(pB, angle, r2a, r2b);
				const front = clipDist > 0;
				const d = `M${d1}ZM${d2}Z`;
				elBrimBackOutline.attr('d', front ? '' : d);
				elBrimBackFill.attr('d', front ? '' : d);
				elBrimFrontOutline.attr('d', front ? d : '');
				elBrimFrontFill.attr('d', front ? d : '');
			} else {
				const clipAngle = Math.asin(clipDist / surfaceRad);
				const angle1 = -clipAngle;
				const angle2 = Pi + clipAngle;
				const seamlessOverlap = Math.min(Pi * 0.1, Pi * 0.5 - Math.abs(clipAngle));
				const dBack1 = svgEllipseSegment(pB, angle, r3a, r3b, angle1, angle2, false);
				const dBack2 = svgEllipseSegment(pB, angle, r2a, r2b, angle2, angle1, true);
				const dFront1 = svgEllipseSegment(pB, angle, r3a, r3b, angle2, angle1 + Pi * 2, false);
				const dFront2 = svgEllipseSegment(pB, angle, r2a, r2b, angle1, angle2 + Pi * 2, true);
				const [seamlessA, seamlessB] = ellipsePoints(pB, angle, (r2a + r3a) / 2, (r2b + r3b) / 2, [angle1 + seamlessOverlap, angle2 - seamlessOverlap]);
				elBrimBackOutline.attr('d', `M${dBack1}M${dBack2}`);
				elBrimFrontOutline.attr('d', `M${dFront1}M${dFront2}`);
				elBrimBackFill.attr('d', `M${dBack1}L${svgPt(seamlessB)}L${dBack2}L${svgPt(seamlessA)}Z`);
				elBrimFrontFill.attr('d', `M${dFront1}L${dFront2}Z`);
			}
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
			const dBase = svgEllipseSegment(pB, angle, r2a, r2b, -coneAngle, Pi + coneAngle, true);
			const dTop = svgEllipseSegment(pT, angle, r1a, r1b, Pi + coneAngle, -coneAngle, false);
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

	function make(value, document) {
		if (typeof value === 'string') {
			return document.createTextNode(value);
		} else if (typeof value === 'number') {
			return document.createTextNode(value.toString(10));
		} else if (typeof value === 'object' && value.element) {
			return value.element;
		} else {
			return value;
		}
	}

	function unwrap(node) {
		if (node === null) {
			return null;
		} else if (node.element) {
			return node.element;
		} else {
			return node;
		}
	}

	class WrappedElement {
		constructor(element) {
			this.element = element;
		}

		addBefore(child = null, before = null) {
			if (child === null) {
				return this;
			} else if (Array.isArray(child)) {
				for (const c of child) {
					this.addBefore(c, before);
				}
			} else {
				const childElement = make(child, this.element.ownerDocument);
				this.element.insertBefore(childElement, unwrap(before));
			}
			return this;
		}

		unshift(...child) {
			return this.addBefore(child, this.element.firstChild);
		}

		add(...child) {
			return this.addBefore(child, null);
		}

		del(child = null) {
			if (child !== null) {
				this.element.removeChild(unwrap(child));
			}
			return this;
		}

		attr(key, value) {
			this.element.setAttribute(key, value);
			return this;
		}

		attrs(attrs) {
			for (const k in attrs) {
				if (Object.prototype.hasOwnProperty.call(attrs, k)) {
					this.element.setAttribute(k, attrs[k]);
				}
			}
			return this;
		}

		styles(styles) {
			for (const k in styles) {
				if (Object.prototype.hasOwnProperty.call(styles, k)) {
					this.element.style[k] = styles[k];
				}
			}
			return this;
		}

		setClass(cls) {
			return this.attr('class', cls);
		}

		addClass(cls) {
			const classes = this.element.getAttribute('class');
			if (!classes) {
				return this.setClass(cls);
			}
			const list = classes.split(' ');
			if (list.includes(cls)) {
				return this;
			}
			list.push(cls);
			return this.attr('class', list.join(' '));
		}

		delClass(cls) {
			const classes = this.element.getAttribute('class');
			if (!classes) {
				return this;
			}
			const list = classes.split(' ');
			const p = list.indexOf(cls);
			if (p !== -1) {
				list.splice(p, 1);
				this.attr('class', list.join(' '));
			}
			return this;
		}

		text(text) {
			this.element.textContent = text;
			return this;
		}

		on(event, callback, options = {}) {
			if (Array.isArray(event)) {
				for (const e of event) {
					this.on(e, callback, options);
				}
			} else {
				this.element.addEventListener(event, callback, options);
			}
			return this;
		}

		off(event, callback, options = {}) {
			if (Array.isArray(event)) {
				for (const e of event) {
					this.off(e, callback, options);
				}
			} else {
				this.element.removeEventListener(event, callback, options);
			}
			return this;
		}

		val(value) {
			this.element.value = value;
			return this;
		}

		select(start, end = null) {
			this.element.selectionStart = start;
			this.element.selectionEnd = (end === null) ? start : end;
			return this;
		}

		focus() {
			this.element.focus();
			return this;
		}

		focussed() {
			return this.element === this.element.ownerDocument.activeElement;
		}

		empty() {
			while (this.element.childNodes.length > 0) {
				this.element.removeChild(this.element.lastChild);
			}
			return this;
		}

		attach(parent) {
			unwrap(parent).appendChild(this.element);
			return this;
		}

		detach() {
			if (this.element.parentNode) {
				this.element.parentNode.removeChild(this.element);
			}
			return this;
		}
	}

	class DOMWrapper {
		constructor(document) {
			if (!document) {
				throw new Error('Missing document!');
			}
			this.document = document;
			this.wrap = this.wrap.bind(this);
			this.el = this.el.bind(this);
			this.txt = this.txt.bind(this);
		}

		wrap(element) {
			if (element.element) {
				return element;
			} else {
				return new WrappedElement(element);
			}
		}

		el(tag, namespace = null) {
			let element = null;
			if (namespace === null) {
				element = this.document.createElement(tag);
			} else {
				element = this.document.createElementNS(namespace, tag);
			}
			return new WrappedElement(element);
		}

		txt(content = '') {
			return this.document.createTextNode(content);
		}
	}

	DOMWrapper.WrappedElement = WrappedElement;

	function encodeChar(c) {
		return '&#' + c.codePointAt(0).toString(10) + ';';
	}

	function escapeHTML(text) {
		return text.replace(
			/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\r\n\t -%'-;=?-~]/g,
			encodeChar
		);
	}

	function escapeQuoted(text) {
		return text.replace(
			/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\r\n\t !#$%'-;=?-~]/g,
			encodeChar
		);
	}

	class TextNode {
		constructor(content) {
			this.parentNode = null;
			this.nodeValue = content;
		}

		contains() {
			return false;
		}

		get textContent() {
			return this.nodeValue;
		}

		set textContent(value) {
			this.nodeValue = value;
		}

		get isConnected() {
			if (this.parentNode !== null) {
				return this.parentNode.isConnected;
			}
			return false;
		}

		get innerHTML() {
			return escapeHTML(this.nodeValue);
		}

		get outerHTML() {
			return this.innerHTML;
		}
	}

	class ElementNode {
		constructor(ownerDocument, tag, namespace) {
			this.ownerDocument = ownerDocument;
			this.tagName = tag;
			this.namespaceURI = namespace;
			this.parentNode = null;
			this.childNodes = [];
			this.attributes = new Map();
			this.style = {};
			this.listeners = new Map();
		}

		setAttribute(key, value) {
			let v = null;
			if (typeof value === 'number') {
				v = value.toString(10);
			} else if (typeof value === 'string') {
				v = value;
			} else {
				throw new Error('Bad value ' + value + ' for attribute ' + key);
			}
			this.attributes.set(key, v);
		}

		getAttribute(key) {
			return this.attributes.get(key);
		}

		addEventListener(event, fn) {
			let list = this.listeners.get(event);
			if (!list) {
				list = [];
				this.listeners.set(event, list);
			}
			list.push(fn);
		}

		removeEventListener(event, fn) {
			const list = this.listeners.get(event) || [];
			const index = list.indexOf(fn);
			if (index !== -1) {
				list.splice(index, 1);
			}
		}

		dispatchEvent(e) {
			const list = this.listeners.get(e.type) || [];
			list.forEach((fn) => fn(e));
		}

		contains(descendant) {
			let check = descendant;
			while (check) {
				if (check === this) {
					return true;
				}
				check = check.parentNode;
			}
			return false;
		}

		getElementsByTagName(tag) {
			const result = [];
			this.traverseDescendants((o) => {
				if (o.tagName === tag) {
					result.push(o);
				}
			});
			return result;
		}

		getElementsByClassName(className) {
			const result = [];
			const check = ' ' + className + ' ';
			this.traverseDescendants((o) => {
				const cls = ' ' + (o.getAttribute('class') || '') + ' ';
				if (cls.indexOf(check) !== -1) {
					result.push(o);
				}
			});
			return result;
		}

		traverseDescendants(fn) {
			if (fn(this) === false) {
				return;
			}
			for (const child of this.childNodes) {
				if (child.traverseDescendants) {
					child.traverseDescendants(fn);
				}
			}
		}

		get firstChild() {
			return this.childNodes[0] || null;
		}

		get lastChild() {
			return this.childNodes[this.childNodes.length - 1] || null;
		}

		indexOf(child) {
			const index = this.childNodes.indexOf(child);
			if (index === -1) {
				throw new Error(child + ' is not a child of ' + this);
			}
			return index;
		}

		insertBefore(child, existingChild) {
			if (child.contains(this)) {
				throw new Error('Cyclic node structures are not permitted');
			}
			if (child.parentNode !== null) {
				child.parentNode.removeChild(child);
			}
			if (existingChild === null) {
				this.childNodes.push(child);
			} else {
				this.childNodes.splice(this.indexOf(existingChild), 0, child);
			}
			child.parentNode = this;
			return child;
		}

		appendChild(child) {
			return this.insertBefore(child, null);
		}

		removeChild(child) {
			this.childNodes.splice(this.indexOf(child), 1);
			child.parentNode = null;
			return child;
		}

		replaceChild(newChild, oldChild) {
			if (newChild === oldChild) {
				return oldChild;
			}
			this.insertBefore(newChild, oldChild);
			return this.removeChild(oldChild);
		}

		get isConnected() {
			return true;
		}

		get textContent() {
			let text = '';
			for (const child of this.childNodes) {
				text += child.textContent;
			}
			return text;
		}

		set textContent(value) {
			for (const child of this.childNodes) {
				child.parentNode = null;
			}
			this.childNodes.length = 0;
			this.appendChild(new TextNode(value));
		}

		get innerHTML() {
			let html = '';
			for (const child of this.childNodes) {
				html += child.outerHTML;
			}
			return html;
		}

		get outerHTML() {
			let attrs = '';
			for (const [key, value] of this.attributes) {
				attrs += ' ' + key + '="' + escapeQuoted(value) + '"';
			}
			return (
				'<' + this.tagName + attrs + '>' +
				this.innerHTML +
				'</' + this.tagName + '>'
			);
		}
	}

	class VirtualDocument {
		createElement(tag) {
			return new ElementNode(this, tag, '');
		}

		createElementNS(ns, tag) {
			return new ElementNode(this, tag, ns || '');
		}

		createTextNode(content) {
			return new TextNode(content);
		}
	}

	function has(o, key) {
		return Object.prototype.hasOwnProperty.call(o, key);
	}

	function viewMat(x, y, r) {
		const s1 = Math.sin(y);
		const c1 = Math.cos(y);
		const s2 = Math.sin(x);
		const c2 = Math.cos(x);
		/* eslint-disable no-mixed-spaces-and-tabs, no-multi-spaces */
		return [
			 c2 * r, -s1 * s2 * r, c1 * s2 * r,
			  0 * r,  c1      * r, s1      * r,
			-s2 * r, -s1 * c2 * r, c1 * c2 * r,
		];
		/* eslint-enable no-mixed-spaces-and-tabs, no-multi-spaces */
	}

	function applyMat$1(v, m) {
		return {
			x: v.x * m[0] + v.y * m[1] + v.z * m[2],
			y: v.x * m[3] + v.y * m[4] + v.z * m[5],
			z: v.x * m[6] + v.y * m[7] + v.z * m[8],
		};
	}

	function blendedParts(blending, base, extractor) {
		let total = 0;
		const all = [];
		for (const [name, proportion] of blending.entries()) {
			const v = extractor(name);
			if (v !== undefined && v !== null) {
				all.push({proportion, v});
				total += proportion;
			}
		}
		if (total < 1) {
			all.push({proportion: 1 - total, v: base});
		} else if (total > 1) {
			const m = 1 / total;
			for (const o of all) {
				o.proportion *= m;
			}
		}
		return all;
	}

	function blendStyles(all) {
		// TODO: per-component blending
		return Object.assign({
			'fill': 'none',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
		}, ...(all.map(({v}) => v)));
	}

	function blendPoints(target, all) {
		for (let i = 0; i < target.length; ++ i) {
			const t = target[i];
			t.x = t.y = t.z = 0;
			for (const {v, proportion} of all) {
				t.x += v[i].x * proportion;
				t.y += v[i].y * proportion;
				t.z += v[i].z * proportion;
			}
		}
	}

	const NS$1 = 'http://www.w3.org/2000/svg';

	function buildComponents(dom, root, components, minBackStroke) {
		const result = new Map();
		for (const part in components) {
			if (!has(components, part)) {
				continue;
			}
			const info = Object.assign({}, components[part]);
			if (info.backRendering === undefined) {
				if (info.styleBack) {
					info.backRendering = true;
				} else {
					info.backRendering = Number(info.style['stroke-width']) > minBackStroke;
				}
			}
			const points = info.points.map(({x, y, z}) => ({x, y, z})); // Make copy
			const elBack = dom.el('path', NS$1).attr('fill-rule', 'evenodd');
			const elFront = dom.el('path', NS$1).attr('fill-rule', 'evenodd');
			result.set(part, {elBack, elFront, info, points});
			root.unshift(elBack);
			root.add(elFront);
		}
		return result;
	}

	function readExpressions(expressions, baseComponents) {
		const result = new Map();
		for (const name in expressions) {
			if (!has(expressions, name)) {
				continue;
			}

			const info = Object.assign({
				ball: {},
				components: {},
			}, expressions[name]);

			for (const part in info.components) {
				if (!has(info.components, part)) {
					continue;
				}

				const base = baseComponents.get(part);
				if (!base) {
					throw new Error(`part "${part}" in "${name}" but not in base`);
				}
				const {points} = info.components[part];
				if (points && points.length !== base.points.length) {
					throw new Error(
						`part "${part}" points mismatch in "${name}"` +
						` (${points.length} != ${base.points.length})`
					);
				}
			}

			result.set(name, info);
		}
		return result;
	}

	function pickDocument(document = null, container = null) {
		if (document !== null) {
			return document;
		}
		if (container !== null) {
			return container.ownerDocument;
		}
		if (typeof window === 'undefined') {
			return new VirtualDocument();
		}
		return window.document;
	}

	class Face {
		static rotationForDirection(dx, dy, dz) {
			const x = Math.atan2(dx, dz);
			const y = Math.atan2(Math.cos(x) * dy, dz);
			return {x, y};
		}

		constructor({
			skin,
			radius = 50,
			padding = 5,
			shift = {x: 0, y: 0},
			zoom = 1,
			rotation = {x: 0, y: 0},
			expressions: initialExpressions = {},
			document = null,
			container = null,
			pointsAsLines = false,
			render = true,
		}) {
			if (typeof skin === 'string') {
				skin = Face.skins[skin];
				if (!skin) {
					throw new Error('Unknown skin: ' + skin);
				}
			}
			if (typeof skin !== 'object') {
				throw new Error('Invalid skin');
			}
			const {
				ball = {},
				liftAngle = 0,
				hat = null,
				components = {},
				expressions = {},
			} = skin;

			this.dom = new DOMWrapper(pickDocument(document, container));
			this.ballInfo = ball;
			this.liftAngle = liftAngle;
			this.radius = radius;
			this.pointsAsLines = pointsAsLines;
			this.expression = new Map();
			this.currentRotation = {x: null, y: null};
			this.mat = [];
			this.dirty = true;

			const size = radius + padding;

			const fxSize = fxShort(size * zoom * 2);
			const fxLeft = fxShort(-shift.x - size);
			const fxTop = fxShort(-shift.y - size);
			const fxBounds = fxShort(size * 2);
			this.root = this.dom.el('svg', NS$1).attrs({
				'height': fxSize,
				'version': '1.1',
				'viewBox': `${fxLeft} ${fxTop} ${fxBounds} ${fxBounds}`,
				'width': fxSize,
				'xmlns': NS$1,
			});
			this.ball = this.dom.el('circle', NS$1).attrs({
				'cx': '0',
				'cy': '0',
				'r': fxShort(radius),
			});
			this.root.add(this.ball);

			const minBackStroke = Number(ball.style['stroke-width']);
			this.components = buildComponents(this.dom, this.root, components, minBackStroke);
			this.expressionInfo = readExpressions(expressions, this.components);

			if (hat) {
				this.hatInfo = {
					brim: Object.assign({innerRadius: 0, outerRadius: 0, style: {}}, hat.brim),
					sides: Object.assign({style: {}}, hat.sides),
					top: Object.assign({radius: 0, style: {}}, hat.top),
				};
				this.hatEl = buildHat(this.dom, this.root);
				const brimY = this.hatInfo.brim.y;
				const smallestBrim = Math.sqrt(1 - brimY * brimY);
				if (this.hatInfo.brim.innerRadius <= smallestBrim) {
					this.hatInfo.brim.innerRadius = smallestBrim;
				}
				const brimFill = Object.assign({
					'fill-rule': 'evenodd',
				}, this.hatInfo.brim.style, {'stroke-width': 0});
				const brimLine = Object.assign({
					'stroke-linecap': 'round',
					'stroke-linejoin': 'round',
				}, this.hatInfo.brim.style, {'fill': 'none'});
				const sides = Object.assign({
					'stroke-linecap': 'round',
					'stroke-linejoin': 'round',
				}, this.hatInfo.sides.style);
				const top = Object.assign({
					'stroke-linecap': 'round',
					'stroke-linejoin': 'round',
				}, this.hatInfo.top.style);
				this.hatEl.elBrimBackFill.attrs(brimFill);
				this.hatEl.elBrimBackOutline.attrs(brimLine);
				this.hatEl.elBrimFrontFill.attrs(brimFill);
				this.hatEl.elBrimFrontOutline.attrs(brimLine);
				this.hatEl.elSides.attrs(sides);
				this.hatEl.elTop.attrs(top);
			} else {
				this.hatInfo = null;
			}

			this.setRotation(rotation);
			this.setExpressions(initialExpressions, true);

			if (container !== null) {
				container.appendChild(this.element());
			}

			if (render) {
				this.render();
			}
		}

		element() {
			return this.root.element;
		}

		getWindowPosition() {
			const bounds = this.element().getBoundingClientRect();
			return {
				x: (bounds.left + bounds.right) / 2,
				y: (bounds.top + bounds.bottom) / 2,
			};
		}

		getPagePosition() {
			const winPos = this.getWindowPosition();
			return {
				x: winPos.x + window.scrollX,
				y: winPos.y + window.scrollY,
			};
		}

		setExpressions(proportions, _forceUpdate = false) {
			let changed = false;
			const toRemove = new Set(this.expression.keys());
			for (const name in proportions) {
				if (!has(proportions, name) || !this.expressionInfo.has(name)) {
					continue;
				}
				const value = proportions[name];
				if (value <= 0) {
					continue;
				}
				toRemove.delete(name);
				if (this.expression.get(name) !== value) {
					this.expression.set(name, value);
					changed = true;
				}
			}
			for (const name of toRemove.values()) {
				this.expression.delete(name);
			}
			if (_forceUpdate || changed || toRemove.size > 0) {
				this._updateExpression();
			}
		}

		setExpression(name) {
			this.setExpressions({[name]: 1});
		}

		setRotation(x, y) {
			if (typeof x === 'object') {
				y = x.y;
				x = x.x;
			}
			y -= this.liftAngle;
			if (this.currentRotation.x === x && this.currentRotation.y === y) {
				return;
			}
			this.currentRotation.x = x;
			this.currentRotation.y = y;
			this.mat = viewMat(x, y, this.radius);
			this.dirty = true;
		}

		look(dx, dy, dz) {
			this.setRotation(Face.rotationForDirection(dx, dy, dz));
		}

		_updateExpression() {
			this.ball.attrs(blendStyles(blendedParts(
				this.expression,
				this.ballInfo.style || {},
				(name) => this.expressionInfo.get(name).ball.style
			)));
			for (const [part, {info, points, elFront, elBack}] of this.components.entries()) {
				elFront.attrs(blendStyles(blendedParts(
					this.expression,
					info.style,
					(name) => (this.expressionInfo.get(name).components[part] || {}).style
				)));

				let backStyle = info.styleBack;
				if (!backStyle) {
					backStyle = Object.assign({}, info.style, {'fill': 'none'});
				}

				elBack.attrs(blendStyles(blendedParts(
					this.expression,
					backStyle,
					(name) => {
						const base = this.expressionInfo.get(name).components[part] || {};
						return base.styleBack || base.style;
					}
				)));

				blendPoints(points, blendedParts(
					this.expression,
					info.points,
					(name) => (this.expressionInfo.get(name).components[part] || {}).points
				));
			}
			this.dirty = true;
		}

		render() {
			if (!this.dirty) {
				return false;
			}
			if (this.hatInfo) {
				renderHat(this.hatInfo, this.mat, this.radius, this.hatEl);
			}
			for (const [, {info, points, elFront, elBack}] of this.components.entries()) {
				const viewPoints = points.map((p) => applyMat$1(p, this.mat));
				let dFront = '';
				let dBack = '';
				if (info.flat === false) {
					dFront = renderLines(viewPoints, {closed: info.closed});
				} else {
					dFront = renderOnBall(viewPoints, {
						closed: info.closed,
						filled: (info.style.fill !== 'none'),
						pointsAsLines: this.pointsAsLines,
						radius: this.radius,
					});
					if (info.backRendering) {
						const backPoints = viewPoints.map((p) => ({x: p.x, y: p.y, z: -p.z}));
						backPoints.reverse();
						dBack = renderOnBall(backPoints, {
							closed: info.closed,
							filled: ((info.styleBack || {fill: 'none'}).fill !== 'none'),
							pointsAsLines: this.pointsAsLines,
							radius: this.radius,
						});
					}
				}
				elFront.attr('d', dFront);
				elBack.attr('d', dBack);
			}
			this.dirty = false;
			return true;
		}

		getSVGCodeSynchronous() {
			this.render();
			return (
				'<?xml version="1.0" encoding="UTF-8" ?>' +
				this.element().outerHTML
			);
		}

		getSVGCode() {
			return Promise.resolve(this.getSVGCodeSynchronous());
		}
	}

	function render(options) {
		const opts = Object.assign({}, options, {
			container: null,
			document: new VirtualDocument(),
		});
		return new Face(opts).getSVGCodeSynchronous();
	}

	function readNumber(v, def) {
		return v ? Number(v) : def;
	}

	function parseTagOptions(element) {
		const ds = element.dataset;
		return {
			skin: ds.faceSkin || 'Clyde',
			radius: readNumber(ds.faceRadius),
			padding: readNumber(ds.facePadding),
			shift: {
				x: readNumber(ds.faceShiftX, 0),
				y: readNumber(ds.faceShiftY, 0),
			},
			zoom: readNumber(ds.faceZoom),
			rotation: {
				x: readNumber(ds.faceRotateX, 0) * Math.PI / 180,
				y: readNumber(ds.faceRotateY, 0) * Math.PI / 180,
			},
			expressions: {[ds.faceExpression]: 1},
		};
	}

	const lookup = new WeakMap();

	function convertOne(element, options = {}) {
		if (element.tagName === 'svg') {
			return null;
		}

		const tagOptions = parseTagOptions(element);

		const face = new Face(Object.assign(tagOptions, options));
		const newElement = face.element();
		const attrs = element.attributes;
		for (let i = 0; i < attrs.length; ++ i) {
			newElement.setAttribute(
				attrs[i].nodeName,
				attrs[i].nodeValue
			);
		}
		element.parentNode.replaceChild(newElement, element);
		lookup.set(newElement, face);
		return face;
	}

	function findConverted(elements) {
		let els = elements;
		if (typeof elements === 'string') {
			els = [...window.document.getElementsByClassName(elements)];
		} else if (Array.isArray(elements)) {
			els = elements;
		} else {
			return lookup.get(elements);
		}
		return els.map((el) => lookup.get(el)).filter((f) => f);
	}

	function convert(elements, options = {}) {
		if (Array.isArray(elements)) {
			return elements
				.map((el) => convertOne(el, options))
				.filter((face) => (face !== null));
		} else {
			return convertOne(elements, options);
		}
	}

	function convertAll(root = null, className = 'face-js') {
		let r = null;
		let cls = null;
		if (typeof root === 'string') {
			r = null;
			cls = root;
		} else {
			r = root;
			cls = className;
		}

		let elements = null;
		if (r && typeof r.length !== 'undefined') {
			elements = r;
		} else {
			elements = (r || window.document).getElementsByClassName(cls);
		}

		// Convert elements
		// (Convert from "live" collection to static to avoid infinite loops)
		convert([...elements]);
	}

	Object.assign(Face, {
		convert,
		convertAll,
		findConverted,
		render,
		skins: {},
	});

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

	function pt(v) {
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

	function pts(v) {
		return v.map(pt);
	}

	function clonePt(v) {
		return Array.isArray(v) ? normalisePt(v) : Object.assign({}, v);
	}

	function clonePts(v) {
		return v.map(clonePt);
	}

	function symmetricX(v) {
		const all = v.slice();
		for (let i = v.length; (i --) > 0;) {
			const p = clonePt(v[i]);
			p.x = -p.x;
			if ((i === 0 || i === v.length - 1) && p.x === 0) {
				continue;
			}
			all.push(p);
		}
		return all;
	}

	function reflectX(v) {
		const all = [];
		for (let i = v.length; (i --) > 0;) {
			const p = clonePt(v[i]);
			p.x = -p.x;
			all.push(p);
		}
		return all;
	}

	function backtraced(v) {
		const all = v.slice();
		for (let i = v.length - 1; (i --) > 0;) {
			all.push(v[i]);
		}
		return all;
	}

	/* eslint-disable sort-keys */

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
				css.lastIndexOf(')')
			);
			const raw = inner.split(',').map((v) => Number.parseInt(v, 10));
			return {
				r: raw[0],
				g: raw[1],
				b: raw[2],
				a: raw.length >= 4 ? raw[3] : 255,
			};
		}
		return {r: 0, g: 0, b: 0, a: 0};
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

	function blendColours(col1, col2, p) {
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

	const EYE = pts([[0.3, -0.05]]);

	const HAIR_RAW = new Map();

	function addHairStyle(name, points) {
		HAIR_RAW.set(name, points);
		return name;
	}

	const HAIR_STYLES = {
		BALD: addHairStyle('bald', []),
		SHORT: addHairStyle('short', symmetricX([
			[0.00, -0.09, true],
			[0.20, -0.09, true],
			[0.40, -0.09, true],
			[0.60, -0.09, true],
			[0.80, -0.09, true],
			[0.90, -0.09, true],
			[0.95, -0.09, true],
			[0.97, -0.09, true],

			[0.99, -0.09],
			[0.97, -0.10],
			[0.95, -0.12],
			[0.93, -0.16],
			[0.91, -0.18],
			[0.88, -0.19],
			[0.85, -0.18],
			[0.82, -0.16],
			[0.79, -0.14],
			[0.76, -0.12],
			[0.73, -0.11],
			[0.70, -0.12],
			[0.67, -0.14],
			[0.62, -0.18],
			[0.55, -0.23],
			[0.48, -0.28],
			[0.40, -0.32],
			[0.33, -0.35],
			[0.24, -0.38],
			[0.14, -0.40],
			[0.00, -0.41],
		])),
		PARTED: addHairStyle('parted', [
			[ 0.00, 0.43, true],
			[ 0.20, 0.42, true],
			[ 0.40, 0.40, true],
			[ 0.60, 0.38, true],
			[ 0.80, 0.35, true],
			[ 0.90, 0.30, true],
			[ 0.95, 0.23, true],
			[ 0.97, 0.20, true],

			[ 0.99, 0.10],
			[ 0.98, 0.07],
			[ 0.96, 0.04],
			[ 0.94, 0.01],
			[ 0.92,-0.02],
			[ 0.90,-0.05],
			[ 0.87,-0.08],
			[ 0.84,-0.11],
			[ 0.81,-0.14],
			[ 0.78,-0.16],
			[ 0.75,-0.18],
			[ 0.72,-0.20],
			[ 0.67,-0.22],
			[ 0.62,-0.24],
			[ 0.56,-0.26],
			[ 0.48,-0.28],
			[ 0.39,-0.30],
			[ 0.31,-0.32],
			[ 0.25,-0.34],
			[ 0.20,-0.36],
			[ 0.15,-0.39],
			[ 0.11,-0.42],
			[ 0.08,-0.45],
			[ 0.05,-0.50],
			[ 0.03,-0.55],
			[-0.06,-0.53],
			[-0.14,-0.51],
			[-0.28,-0.48],
			[-0.30,-0.47],
			[-0.39,-0.44],
			[-0.48,-0.40],
			[-0.55,-0.37],
			[-0.62,-0.33],
			[-0.68,-0.29],
			[-0.73,-0.25],
			[-0.78,-0.21],
			[-0.82,-0.16],
			[-0.86,-0.11],
			[-0.92,-0.02],
			[-0.94, 0.03],
			[-0.96, 0.08],
			[-0.99, 0.20],

			[-0.97, 0.23, true],
			[-0.95, 0.25, true],
			[-0.90, 0.31, true],
			[-0.80, 0.36, true],
			[-0.60, 0.37, true],
			[-0.40, 0.40, true],
			[-0.20, 0.42, true],
		]),
	};

	function hairPointsRaw(style = null) {
		if (style === null) {
			return [];
		}
		const points = HAIR_RAW.get(style);
		if (!points) {
			throw new Error('Unknown hair style: ' + style);
		}
		return clonePts(points);
	}

	const MOUTH_NORMAL = symmetricX(backtraced(pts([
		[0.00, 0.640],
		[0.10, 0.635],
		[0.20, 0.620],
		[0.30, 0.600],
	])));

	const MOUTH_SMILE = symmetricX(backtraced(pts([
		[0.00, 0.650],
		[0.12, 0.630],
		[0.24, 0.590],
		[0.36, 0.520],
	])));

	const MOUTH_SAD = symmetricX(backtraced(pts([
		[0.00, 0.639],
		[0.10, 0.641],
		[0.20, 0.645],
		[0.30, 0.650],
	])));

	const MOUTH_LAUGH = symmetricX(pts([
		[0.00, 0.640],
		[0.10, 0.630],
		[0.20, 0.610],
		[0.30, 0.580],
		[0.20, 0.680],
		[0.10, 0.760],
		[0.00, 0.780],
	]));

	const MOUTH_SHOCK = symmetricX(pts([
		[0.00, 0.625],
		[0.10, 0.630],
		[0.15, 0.640],
		[0.20, 0.660],
		[0.15, 0.700],
		[0.10, 0.740],
		[0.00, 0.750],
	]));

	function fillFrom(style) {
		if (!style) {
			return 'rgba(0,0,0,0)';
		} else if (typeof style === 'object') {
			return style.fill;
		} else if (typeof style === 'string') {
			return style;
		} else {
			throw new Error('Unknown fill type: ' + style);
		}
	}

	function strokeFrom(style, defaultLum) {
		if (typeof style === 'object' && style.stroke) {
			return style.stroke;
		}
		if (defaultLum === 0) {
			return '#000000';
		}
		return blendColours('#000000', fillFrom(style), defaultLum);
	}

	const makeFace = ({skin, hair, hairStyle}) => ({
		ball: {
			style: {
				'stroke': strokeFrom(skin, 0),
				'stroke-width': 1.8,
				'fill': fillFrom(skin),
			},
		},
		liftAngle: Math.PI * 0.07,
		components: {
			'hair': {
				style: {
					'stroke': strokeFrom(hair, 0.6),
					'stroke-width': 2.2,
					'fill': fillFrom(hair),
				},
				backRendering: false,
				closed: true,
				points: pts(hairPointsRaw(hairStyle)),
			},
			'left-eye': {
				style: EYE_STYLE,
				points: reflectX(EYE),
			},
			'right-eye': {
				style: EYE_STYLE,
				points: EYE,
			},
			'nose': {
				style: {
					'stroke': '#000000',
					'stroke-width': 5,
				},
				flat: false,
				points: pts([
					[0.0, 0.2, null, 1.0],
					[0.0, 0.2, null, 1.2],
				]),
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 2,
					'fill': '#FFFFFF',
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
					'mouth': {
						points: MOUTH_SMILE,
					},
				},
			},
			'sad': {
				components: {
					'mouth': {
						points: MOUTH_SAD,
					},
				},
			},
			'laugh': {
				components: {
					'mouth': {
						points: MOUTH_LAUGH,
					},
				},
			},
			'shock': {
				components: {
					'mouth': {
						points: MOUTH_SHOCK,
					},
				},
			},
		},
	});

	// Wrap in function to allow instantiation via New
	function Doe(options) {
		return makeFace(options);
	}

	const NORTH_EUROPEAN_PALE = '#FFF4D1';
	const NORTH_EUROPEAN_DARK = '#FDE8AA';
	const WEST_AFRICAN_PALE = '#8C5822';
	const WEST_AFRICAN_DARK = '#281824';

	Doe.skin = function({
		european = 0,
		african = 0,
		pale = 0,
	}) {
		return blendColours(
			blendColours(NORTH_EUROPEAN_DARK, NORTH_EUROPEAN_PALE, pale),
			blendColours(WEST_AFRICAN_DARK, WEST_AFRICAN_PALE, pale),
			african / (european + african)
		);
	};

	Doe.HAIR = {
		BLONDE: '#F2C354',
		BLACK: {
			fill: '#281C11',
			stroke: '#000000',
		},
		BROWN: {
			fill: '#996633',
			stroke: '#664422',
		},
		DARK_BLONDE: {
			fill: '#C69F45',
			stroke: '#695320',
		},
		PURPLE: '#CC3366',
		WHITE: {
			fill: '#EEE8E0',
			stroke: '#666666',
		},
	};

	Doe.HAIR_STYLE = HAIR_STYLES;

	const HIDE$1 = {
		style: {
			'opacity': 0,
		},
	};

	const EYE_STYLE$1 = {
		'stroke': '#000000',
		'stroke-width': 4,
		'opacity': 1,
	};

	const EYE$1 = pts([[0.3, -0.05], [0.3, -0.01]]);

	const HAIR_STYLE = {
		'stroke': '#000000',
		'stroke-width': 3,
		'fill': '#382300',
	};

	const MOUSTACHE_NEUTRAL = pts([
		[0.10, 0.480],
		[0.20, 0.430],
		[0.30, 0.410, null, 1.02],
		[0.40, 0.300, null, 1.05],
		[0.40, 0.410, null, 1.02],
		[0.20, 0.530],
	]);

	const MOUSTACHE_SMILE = pts([
		[0.10, 0.460],
		[0.20, 0.410],
		[0.30, 0.390, null, 1.02],
		[0.40, 0.280, null, 1.05],
		[0.40, 0.390, null, 1.02],
		[0.20, 0.510],
	]);

	const MOUSTACHE_SAD = pts([
		[0.10, 0.500],
		[0.20, 0.470],
		[0.30, 0.470, null, 1.02],
		[0.40, 0.340, null, 1.05],
		[0.40, 0.470, null, 1.02],
		[0.20, 0.540],
	]);

	const MOUSTACHE_LAUGH = pts([
		[0.10, 0.480],
		[0.20, 0.430],
		[0.30, 0.430, null, 1.02],
		[0.40, 0.320, null, 1.05],
		[0.40, 0.430, null, 1.02],
		[0.20, 0.530],
	]);

	const MOUSTACHE_SHOCK = pts([
		[0.10, 0.480],
		[0.20, 0.430],
		[0.30, 0.410, null, 1.02],
		[0.40, 0.300, null, 1.05],
		[0.40, 0.410, null, 1.02],
		[0.20, 0.530],
	]);

	const HAT_STYLE = {
		'stroke': '#000000',
		'stroke-width': 3,
		'fill': '#111111',
	};

	var Bonfire = {
		ball: {
			style: {
				'stroke': '#504020',
				'stroke-width': 2,
				'fill': '#FDE8AA',
			},
		},
		liftAngle: Math.PI * 0.07,
		hat: {
			brim: {
				y: -0.3,
				outerRadius: 1.4,
				style: HAT_STYLE,
			},
			sides: {
				style: HAT_STYLE,
			},
			top: {
				y: -1.2,
				radius: 0.6,
				style: HAT_STYLE,
			},
		},
		components: {
			'hair': {
				style: HAIR_STYLE,
				closed: true,
				points: symmetricX(pts([
					[0.00, 0.00, true],
					[0.20, 0.00, true],
					[0.40, 0.00, true],
					[0.60, 0.00, true],
					[0.80, 0.20, true],
					[0.81, 0.30, true],
					[0.82, 0.40, true],
					[0.83, 0.54, true],

					[0.84, 0.54],
					[0.83, 0.55],
					[0.82, 0.55],
					[0.81, 0.56],
					[0.80, 0.54],
					[0.79, 0.50],
					[0.75, 0.42],
					[0.70, 0.30],
					[0.65, 0.15],
					[0.60, 0.03],
					[0.55,-0.07],
					[0.50,-0.17],
					[0.44,-0.25],
					[0.40,-0.30],
					[0.33,-0.35],
					[0.24,-0.38],
					[0.14,-0.40],
					[0.00,-0.41],
				])),
			},
			'left-eye': {
				style: EYE_STYLE$1,
				points: reflectX(EYE$1),
			},
			'right-eye': {
				style: EYE_STYLE$1,
				points: EYE$1,
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 3,
					'fill': '#FFFFFF',
				},
				closed: true,
				points: MOUTH_NORMAL,
			},
			'beard': {
				style: HAIR_STYLE,
				flat: false,
				closed: true,
				points: symmetricX(pts([
					[0.00, 0.750],
					[0.15, 0.720],
					[0.20, 0.750],
					[0.10, 0.800, null, 1.1],
					[0.00, 0.900, null, 1.3],
				])),
			},
			'left-moustache': {
				style: HAIR_STYLE,
				flat: false,
				closed: true,
				points: reflectX(MOUSTACHE_NEUTRAL),
			},
			'right-moustache': {
				style: HAIR_STYLE,
				flat: false,
				closed: true,
				points: MOUSTACHE_NEUTRAL,
			},
			'nose': {
				style: {
					'fill': '#FDE8AA',
					'stroke': '#000000',
					'stroke-width': 4,
				},
				flat: false,
				points: pts([
					[0.0, 0.2, null, 1.0],
					[0.0, 0.4, null, 1.2],
					[0.0, 0.5, null, 1.0],
				]),
			},
		},
		expressions: {
			'eyes-closed': {
				components: {
					'left-eye': HIDE$1,
					'right-eye': HIDE$1,
				},
			},
			'smile': {
				components: {
					'mouth': {
						points: MOUTH_SMILE,
					},
					'beard': {
						points: symmetricX(pts([
							[0.00, 0.750],
							[0.17, 0.720],
							[0.25, 0.700],
							[0.12, 0.800, null, 1.1],
							[0.00, 0.900, null, 1.3],
						])),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_SMILE),
					},
					'right-moustache': {
						points: MOUSTACHE_SMILE,
					},
				},
			},
			'sad': {
				components: {
					'mouth': {
						points: MOUTH_SAD,
					},
					'beard': {
						points: symmetricX(pts([
							[0.00, 0.750],
							[0.15, 0.750],
							[0.20, 0.770],
							[0.10, 0.800, null, 1.1],
							[0.00, 0.900, null, 1.3],
						])),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_SAD),
					},
					'right-moustache': {
						points: MOUSTACHE_SAD,
					},
				},
			},
			'laugh': {
				components: {
					'mouth': {
						points: MOUTH_LAUGH,
					},
					'beard': {
						points: symmetricX(pts([
							[0.00, 0.850],
							[0.15, 0.820],
							[0.15, 0.850],
							[0.10, 0.880, null, 1.1],
							[0.00, 0.950, null, 1.4],
						])),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_LAUGH),
					},
					'right-moustache': {
						points: MOUSTACHE_LAUGH,
					},
				},
			},
			'shock': {
				components: {
					'mouth': {
						points: MOUTH_SHOCK,
					},
					'beard': {
						points: symmetricX(pts([
							[0.00, 0.850],
							[0.15, 0.820],
							[0.15, 0.850],
							[0.10, 0.800, null, 1.1],
							[0.00, 0.950, null, 1.4],
						])),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_SHOCK),
					},
					'right-moustache': {
						points: MOUSTACHE_SHOCK,
					},
				},
			},
		},
	};

	const HIDE$2 = {
		style: {
			'opacity': 0,
		},
	};

	const EYE_STYLE$2 = {
		'stroke': '#000000',
		'stroke-width': 5,
		'opacity': 1,
	};

	const EYE$2 = pts([[0.25, -0.05], [0.25, -0.02]]);

	const CHEEK_STYLE = {
		'stroke': '#F7D1AF',
		'stroke-width': 5,
		'opacity': 1,
	};

	const CHEEK = pts([[0.29, 0.08]]);

	const HAIR_STYLE$1 = {
		'stroke': '#202020',
		'stroke-width': 3,
		'fill': '#FFFFFF',
	};

	const MOUSTACHE_NEUTRAL$1 = pts([
		[0.06, 0.47],
		[0.13, 0.38],
		[0.21, 0.33, null, 1.02],
		[0.31, 0.33, null, 1.02],
		[0.48, 0.33, null, 1.02],
		[0.61, 0.34, null, 1.05],
		[0.52, 0.45, null, 1.02],
		[0.39, 0.53],
		[0.25, 0.57],
		[0.16, 0.58],
		[0.06, 0.55],
	]);

	const MOUSTACHE_SMILE$1 = pts([
		[0.06, 0.47],
		[0.13, 0.38],
		[0.21, 0.33, null, 1.02],
		[0.33, 0.31, null, 1.02],
		[0.49, 0.29, null, 1.02],
		[0.62, 0.29, null, 1.05],
		[0.53, 0.43, null, 1.02],
		[0.39, 0.52],
		[0.26, 0.56],
		[0.16, 0.58],
		[0.06, 0.55],
	]);

	const MOUSTACHE_SAD$1 = pts([
		[0.06, 0.47],
		[0.13, 0.38],
		[0.21, 0.33, null, 1.02],
		[0.31, 0.33, null, 1.02],
		[0.48, 0.33, null, 1.02],
		[0.61, 0.34, null, 1.05],
		[0.52, 0.45, null, 1.02],
		[0.39, 0.53],
		[0.25, 0.57],
		[0.16, 0.58],
		[0.06, 0.55],
	]);

	const MOUSTACHE_LAUGH$1 = pts([
		[0.06, 0.47],
		[0.13, 0.38],
		[0.21, 0.33, null, 1.02],
		[0.32, 0.28, null, 1.02],
		[0.45, 0.24, null, 1.02],
		[0.57, 0.25, null, 1.05],
		[0.52, 0.39, null, 1.02],
		[0.39, 0.49],
		[0.26, 0.55],
		[0.16, 0.58],
		[0.06, 0.55],
	]);

	const MOUSTACHE_SHOCK$1 = pts([
		[0.06, 0.47],
		[0.13, 0.38],
		[0.21, 0.33, null, 1.02],
		[0.31, 0.33, null, 1.02],
		[0.48, 0.33, null, 1.02],
		[0.61, 0.34, null, 1.05],
		[0.52, 0.45, null, 1.02],
		[0.39, 0.53],
		[0.25, 0.57],
		[0.16, 0.58],
		[0.06, 0.55],
	]);

	var Christmas = {
		ball: {
			style: {
				'fill': '#F7D1AF',
			},
		},
		liftAngle: Math.PI * 0.1,
		hat: {
			brim: {
				y: -0.6,
			},
			sides: {
				style: {
					'stroke': '#560F06',
					'stroke-width': 3,
					'fill': '#EF3A22',
				},
			},
			top: {
				y: -1.9,
				radius: 0,
			},
		},
		components: {
			'left-eye': {
				style: EYE_STYLE$2,
				points: reflectX(EYE$2),
			},
			'right-eye': {
				style: EYE_STYLE$2,
				points: EYE$2,
			},
			'left-cheek': {
				style: CHEEK_STYLE,
				points: reflectX(CHEEK),
			},
			'right-cheek': {
				style: CHEEK_STYLE,
				points: CHEEK,
			},
			'forced-outline': {
				style: {
					'stroke': '#000000',
					'stroke-width': 3,
				},
				closed: true,
				// Arbitrary shape at back to force rendering outline above cheeks
				points: pts([
					[ 0.0,-0.1, true],
					[ 0.1, 0.1, true],
					[-0.1, 0.1, true],
				]),
			},
			'hair': {
				style: HAIR_STYLE$1,
				closed: true,
				points: pts([
					[ 0.09, 0.88],
					[ 0.24, 0.83],
					[ 0.36, 0.75],
					[ 0.46, 0.66],
					[ 0.51, 0.52],
					[ 0.53, 0.37],
					[ 0.49, 0.24],
					[ 0.51, 0.14],
					[ 0.48, 0.03],
					[ 0.48,-0.08],
					[ 0.44,-0.18],
					[ 0.36,-0.27],
					[ 0.27,-0.35],
					[ 0.14,-0.40],
					[ 0.01,-0.40],
					[-0.13,-0.36],
					[-0.24,-0.33],
					[-0.35,-0.29],
					[-0.41,-0.22],
					[-0.45,-0.16],
					[-0.52,-0.08],
					[-0.52, 0.04],
					[-0.50, 0.17],
					[-0.51, 0.32],
					[-0.52, 0.45],
					[-0.54, 0.56],
					[-0.50, 0.67],
					[-0.38, 0.78],
					[-0.25, 0.86],
					[-0.09, 0.90],
				]),
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 2,
					'fill': '#FFFFFF',
				},
				closed: true,
				points: MOUTH_NORMAL,
			},
			'beard': {
				style: HAIR_STYLE$1,
				flat: false,
				closed: true,
				points: pts([
					[ 0.12, 0.67],
					[ 0.25, 0.62],
					[ 0.31, 0.59],
					[ 0.46, 0.54],
					[ 0.54, 0.65],
					[ 0.54, 0.65],
					[ 0.34, 0.90, null, 1.1],
					[ 0.00, 0.98, null, 1.1],
					[-0.29, 0.93, null, 1.1],
					[-0.51, 0.83],
					[-0.61, 0.62],
					[-0.55, 0.51],
					[-0.37, 0.54],
					[-0.22, 0.63],
					[-0.08, 0.67],
				]),
			},
			'left-moustache': {
				style: HAIR_STYLE$1,
				flat: false,
				closed: true,
				points: reflectX(MOUSTACHE_NEUTRAL$1),
			},
			'right-moustache': {
				style: HAIR_STYLE$1,
				flat: false,
				closed: true,
				points: MOUSTACHE_NEUTRAL$1,
			},
			'nose': {
				style: {
					'stroke': '#403020',
					'stroke-width': 3,
					'fill': '#F7D1AF',
				},
				flat: false,
				points: pts([
					[0.0, 0.2, null, 1.0],
					[0.0, 0.4, null, 1.15],
					[0.0, 0.5, null, 1.0],
				]),
			},
		},
		expressions: {
			'eyes-closed': {
				components: {
					'left-eye': HIDE$2,
					'right-eye': HIDE$2,
				},
			},
			'smile': {
				components: {
					'mouth': {
						points: MOUTH_SMILE,
					},
					'beard': {
						points: pts([
							[ 0.15, 0.64],
							[ 0.31, 0.55],
							[ 0.39, 0.46],
							[ 0.55, 0.48],
							[ 0.57, 0.63],
							[ 0.53, 0.79],
							[ 0.34, 0.88, null, 1.1],
							[-0.01, 0.96, null, 1.1],
							[-0.33, 0.91, null, 1.1],
							[-0.53, 0.81],
							[-0.61, 0.62],
							[-0.60, 0.47],
							[-0.45, 0.46],
							[-0.30, 0.60],
							[-0.08, 0.67],
						]),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_SMILE$1),
					},
					'right-moustache': {
						points: MOUSTACHE_SMILE$1,
					},
				},
			},
			'sad': {
				components: {
					'mouth': {
						points: MOUTH_SAD,
					},
					'beard': {
						points: pts([
							[ 0.10, 0.61],
							[ 0.22, 0.64],
							[ 0.28, 0.64],
							[ 0.41, 0.55],
							[ 0.53, 0.55],
							[ 0.54, 0.65],
							[ 0.34, 0.90, null, 1.1],
							[ 0.00, 0.98, null, 1.1],
							[-0.29, 0.93, null, 1.1],
							[-0.51, 0.83],
							[-0.61, 0.62],
							[-0.55, 0.53],
							[-0.41, 0.55],
							[-0.26, 0.63],
							[-0.08, 0.60],
						]),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_SAD$1),
					},
					'right-moustache': {
						points: MOUSTACHE_SAD$1,
					},
				},
			},
			'laugh': {
				components: {
					'mouth': {
						points: MOUTH_LAUGH,
					},
					'beard': {
						points: pts([
							[ 0.08, 0.75],
							[ 0.24, 0.67],
							[ 0.31, 0.57],
							[ 0.46, 0.54],
							[ 0.56, 0.58],
							[ 0.56, 0.69],
							[ 0.34, 0.90, null, 1.1],
							[ 0.00, 0.98, null, 1.1],
							[-0.29, 0.93, null, 1.1],
							[-0.51, 0.83],
							[-0.61, 0.62],
							[-0.55, 0.51],
							[-0.37, 0.54],
							[-0.23, 0.69],
							[-0.10, 0.75],
						]),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_LAUGH$1),
					},
					'right-moustache': {
						points: MOUSTACHE_LAUGH$1,
					},
				},
			},
			'shock': {
				components: {
					'mouth': {
						points: MOUTH_SHOCK,
					},
					'beard': {
						points: pts([
							[ 0.08, 0.75],
							[ 0.24, 0.67],
							[ 0.31, 0.57],
							[ 0.46, 0.54],
							[ 0.56, 0.58],
							[ 0.56, 0.69],
							[ 0.34, 0.90, null, 1.1],
							[ 0.00, 0.98, null, 1.1],
							[-0.29, 0.93, null, 1.1],
							[-0.51, 0.83],
							[-0.61, 0.62],
							[-0.55, 0.51],
							[-0.37, 0.54],
							[-0.23, 0.69],
							[-0.10, 0.75],
						]),
					},
					'left-moustache': {
						points: reflectX(MOUSTACHE_SHOCK$1),
					},
					'right-moustache': {
						points: MOUSTACHE_SHOCK$1,
					},
				},
			},
		},
	};

	function circle(rad, steps) {
		const result = [];
		for (let i = 0; i < steps; ++ i) {
			const angle = i * Math.PI * 2 / steps;
			result.push([Math.sin(angle) * rad, -Math.cos(angle) * rad]);
		}
		return result;
	}

	var Eye = {
		ball: {
			style: {
				'stroke': '#808080',
				'stroke-width': 2,
				'fill': '#FFFFFF',
			},
		},
		components: {
			'iris': {
				style: {
					'stroke': '#008000',
					'stroke-width': 2,
					'fill': '#00CC66',
				},
				closed: true,
				points: pts(circle(0.5, 32)),
			},
			'pupil': {
				style: {
					'stroke': '#000000',
					'stroke-width': 1,
					'fill': '#000000',
				},
				closed: true,
				points: pts(circle(0.2, 32)),
			},
		},
	};

	function roughY(v) {
		return v.map(clonePt).map((pt$$1) => {
			const dy = Math.random() * 0.02 - Math.random() * 0.01;
			pt$$1.y += dy;
			pt$$1.d = 1;
			return pt$$1;
		});
	}

	function shift(v, origin) {
		const o = normalisePt(origin);
		return v.map(clonePt).map((pt$$1) => {
			pt$$1.x += o.x;
			pt$$1.y += o.y;
			if (o.z !== null) {
				pt$$1.z += o.z;
			}
			return pt$$1;
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

	function Halloween(base) {
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

	function outlineFill(outline, flood, line = 2) {
		return {
			'stroke': outline,
			'stroke-width': line,
			'fill': flood,
			'opacity': 0.3,
		};
	}

	var TestPattern = {
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

	const Amy = new Doe({
		skin: Doe.skin({european: 1, pale: 1}),
		hair: Doe.HAIR.BROWN,
		hairStyle: Doe.HAIR_STYLE.PARTED,
	});

	const Bert = new Doe({
		skin: Doe.skin({african: 1, pale: 1}),
		hair: Doe.HAIR.BLACK,
		hairStyle: Doe.HAIR_STYLE.SHORT,
	});

	const Clyde = new Doe({
		skin: Doe.skin({european: 1, pale: 0}),
		hair: Doe.HAIR.DARK_BLONDE,
		hairStyle: Doe.HAIR_STYLE.SHORT,
	});

	const Dean = new Doe({
		skin: Doe.skin({european: 0.9, african: 0.1, pale: 0.5}),
		hairStyle: Doe.HAIR_STYLE.BALD,
	});

	var skins = {
		Amy,
		Bert,
		Bonfire,
		Christmas,
		Clyde,
		Dean,
		Doe,
		Eye,
		Halloween,
		HalloweenAmy: new Halloween(Amy),
		HalloweenBert: new Halloween(Bert),
		HalloweenClyde: new Halloween(Clyde),
		HalloweenDean: new Halloween(Dean),
		TestPattern,
	};

	Object.assign(Face.skins, skins);

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = Face;
	} else if (typeof exports !== 'undefined') {
		exports.Face = Face;
	} else if (window.define && window.define.amd) {
		window.define(() => Face);
	} else {
		window.Face = Face;

		window.addEventListener('DOMContentLoaded', () => {
			Face.convertAll();
		}, {once: true});
	}

}());
