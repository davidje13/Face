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

		const angle = Math.atan2(dir.y, dir.x) + Math.PI * 0.5;

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

	function buildComponents(dom, root, components) {
		const result = new Map();
		for (const part in components) {
			if (!has(components, part)) {
				continue;
			}
			const info = components[part];
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
			radius = 100,
			padding = 0,
			shift = {x: 0, y: 0},
			zoom = 1,
			rotation = {x: 0, y: 0},
			expressions: initialExpressions = {},
			document = null,
			container = null,
			pointsAsLines = false,
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

			this.components = buildComponents(this.dom, this.root, components);
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
				const brimFill = Object.assign({}, this.hatInfo.brim.style, {'stroke-width': 0});
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

			this.render();
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

				elBack.attrs(blendStyles(blendedParts(
					this.expression,
					info.styleBack || info.style,
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
			for (const [, {info, points, elFront}] of this.components.entries()) {
				const viewPoints = points.map((p) => applyMat$1(p, this.mat));
				let d;
				if (info.flat === false) {
					d = renderLines(viewPoints, {closed: info.closed});
				} else {
					d = renderOnBall(viewPoints, {
						closed: info.closed,
						filled: (info.style.fill !== 'none'),
						pointsAsLines: this.pointsAsLines,
						radius: this.radius,
					});
				}
				elFront.attr('d', d);
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

	Object.assign(Face, {
		render,
		skins: {},
	});

	/* TODO: santa hat fluff
	this.sy = 0.0;
	this.sz = 0.0;
	this.bloc = 0.6;
	this.hgt = 1.3;

	this.l = Math.sqrt( 1 - this.bloc * this.bloc );

	this.fluffNum = 20;
	this.aFluff = new Array( fluffNum );
	for( i = 0; i < this.fluffNum / 2; i ++ )
		this.aFluff[ i ] = this.attachMovie( 'fluff', 'f' + i, i * 2 + 10 );
	for( ; i < this.fluffNum; i ++ )
		this.aFluff[ i ] = this.attachMovie( 'fluff', 'f' + i, (this.fluffNum - 1 - i - Math.floor( this.fluffNum / 2 )) * 2 + 1 + 10 );
	for( i = 0; i < this.fluffNum; i ++ )
		this.aFluff[ i ]._xscale = this.aFluff[ i ]._yscale = 75;

	function SetScales( ax, sy, sz ) {
		this.ax = ax;
		this.sy = sy;
		this.sz = sz;
	}
	function Draw( rad ) {
		this.clear( );

		this.DrawConnect( rad );

		while( ax > Math.PI / this.fluffNum )
			ax -= Math.PI * 2 / this.fluffNum;
		while( ax < -Math.PI / this.fluffNum )
			ax += Math.PI * 2 / this.fluffNum;
		fluff._x = 0;
		fluff._y = -(this.bloc + this.hgt) * rad * this.sy;
		for( i = 0; i < this.fluffNum; i ++ ) {
			this.aFluff[ i ]._x = Math.cos( i * Math.PI * 2 / this.fluffNum - Math.PI / 2 - ax ) * (rad + 5) * l;
			this.aFluff[ i ]._y = Math.sin( i * Math.PI * 2 / this.fluffNum - Math.PI / 2 - ax ) * (rad + 5) * l * this.sz - this.bloc * rad * this.sy;
			this.aFluff[ i ]._visible = Math.sin( i * Math.PI * 2 / this.fluffNum - Math.PI / 2 - ax ) > 0;
		}
	}
	*/

	function pt({x, y, z = null, d = null, back = false}) {
		/* eslint-disable no-param-reassign */
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
		/* eslint-enable no-param-reassign */
	}

	function pts(v) {
		return v.map(pt);
	}

	function symmetricX(v) {
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

	function reflectX(v) {
		const all = [];
		for (let i = v.length; (i --) > 0;) {
			const p = Object.assign({}, v[i]);
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

	const HIDE = {
		style: {
			'opacity': 0,
		},
	};

	const EYE_STYLE = {
		'stroke': '#000000',
		'stroke-width': 4,
		'opacity': 1,
	};

	const EYE = pts([{x: 0.3, y: -0.05}, {x: 0.3, y: -0.01}]);

	const HAIR_STYLE = {
		'stroke': '#000000',
		'stroke-width': 3,
		'fill': '#382300',
	};

	const MOUSTACHE_NEUTRAL = pts([
		{x: 0.10, y: 0.480},
		{x: 0.20, y: 0.430},
		{x: 0.30, y: 0.410, d: 1.02},
		{x: 0.40, y: 0.300, d: 1.05},
		{x: 0.40, y: 0.410, d: 1.02},
		{x: 0.20, y: 0.530},
	]);

	const MOUSTACHE_SMILE = pts([
		{x: 0.10, y: 0.460},
		{x: 0.20, y: 0.410},
		{x: 0.30, y: 0.390, d: 1.02},
		{x: 0.40, y: 0.280, d: 1.05},
		{x: 0.40, y: 0.390, d: 1.02},
		{x: 0.20, y: 0.510},
	]);

	const MOUSTACHE_SAD = pts([
		{x: 0.10, y: 0.500},
		{x: 0.20, y: 0.470},
		{x: 0.30, y: 0.470, d: 1.02},
		{x: 0.40, y: 0.340, d: 1.05},
		{x: 0.40, y: 0.470, d: 1.02},
		{x: 0.20, y: 0.540},
	]);

	const MOUSTACHE_LAUGH = pts([
		{x: 0.10, y: 0.480},
		{x: 0.20, y: 0.430},
		{x: 0.30, y: 0.430, d: 1.02},
		{x: 0.40, y: 0.320, d: 1.05},
		{x: 0.40, y: 0.430, d: 1.02},
		{x: 0.20, y: 0.530},
	]);

	const MOUSTACHE_SHOCK = pts([
		{x: 0.10, y: 0.480},
		{x: 0.20, y: 0.430},
		{x: 0.30, y: 0.410, d: 1.02},
		{x: 0.40, y: 0.300, d: 1.05},
		{x: 0.40, y: 0.410, d: 1.02},
		{x: 0.20, y: 0.530},
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
					{x: 0.00, y: 0.00, back: true},
					{x: 0.20, y: 0.00, back: true},
					{x: 0.40, y: 0.00, back: true},
					{x: 0.60, y: 0.00, back: true},
					{x: 0.80, y: 0.20, back: true},
					{x: 0.81, y: 0.30, back: true},
					{x: 0.82, y: 0.40, back: true},
					{x: 0.83, y: 0.54, back: true},

					{x: 0.84, y: 0.54},
					{x: 0.83, y: 0.55},
					{x: 0.82, y: 0.55},
					{x: 0.81, y: 0.56},
					{x: 0.80, y: 0.54},
					{x: 0.79, y: 0.50},
					{x: 0.75, y: 0.42},
					{x: 0.70, y: 0.30},
					{x: 0.65, y: 0.15},
					{x: 0.60, y: 0.03},
					{x: 0.55, y:-0.07},
					{x: 0.50, y:-0.17},
					{x: 0.44, y:-0.25},
					{x: 0.40, y:-0.30},
					{x: 0.33, y:-0.35},
					{x: 0.24, y:-0.38},
					{x: 0.14, y:-0.40},
					{x: 0.00, y:-0.41},
				])),
			},
			'left-eye': {
				style: EYE_STYLE,
				points: reflectX(EYE),
			},
			'right-eye': {
				style: EYE_STYLE,
				points: EYE,
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 3,
					'fill': '#FFFFFF',
				},
				closed: true,
				points: symmetricX(backtraced(pts([
					{x: 0.00, y: 0.640},
					{x: 0.10, y: 0.635},
					{x: 0.20, y: 0.620},
					{x: 0.30, y: 0.600},
				]))),
			},
			'beard': {
				style: HAIR_STYLE,
				flat: false,
				closed: true,
				points: symmetricX(pts([
					{x: 0.00, y: 0.750},
					{x: 0.15, y: 0.720},
					{x: 0.20, y: 0.750},
					{x: 0.10, y: 0.800, d: 1.1},
					{x: 0.00, y: 0.900, d: 1.3},
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
					{x: 0.0, y: 0.2, d: 1.0},
					{x: 0.0, y: 0.4, d: 1.2},
					{x: 0.0, y: 0.5, d: 1.0},
				]),
			},
		},
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
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.650},
							{x: 0.12, y: 0.630},
							{x: 0.24, y: 0.590},
							{x: 0.36, y: 0.520},
						]))),
					},
					'beard': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.750},
							{x: 0.17, y: 0.720},
							{x: 0.25, y: 0.700},
							{x: 0.12, y: 0.800, d: 1.1},
							{x: 0.00, y: 0.900, d: 1.3},
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
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.639},
							{x: 0.10, y: 0.641},
							{x: 0.20, y: 0.645},
							{x: 0.30, y: 0.650},
						]))),
					},
					'beard': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.750},
							{x: 0.15, y: 0.750},
							{x: 0.20, y: 0.770},
							{x: 0.10, y: 0.800, d: 1.1},
							{x: 0.00, y: 0.900, d: 1.3},
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
						points: symmetricX(pts([
							{x: 0.00, y: 0.640},
							{x: 0.10, y: 0.630},
							{x: 0.20, y: 0.610},
							{x: 0.30, y: 0.580},
							{x: 0.20, y: 0.680},
							{x: 0.10, y: 0.760},
							{x: 0.00, y: 0.780},
						])),
					},
					'beard': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.850},
							{x: 0.15, y: 0.820},
							{x: 0.15, y: 0.850},
							{x: 0.10, y: 0.880, d: 1.1},
							{x: 0.00, y: 0.950, d: 1.4},
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
						points: symmetricX(pts([
							{x: 0.00, y: 0.625},
							{x: 0.10, y: 0.630},
							{x: 0.15, y: 0.640},
							{x: 0.20, y: 0.660},
							{x: 0.15, y: 0.700},
							{x: 0.10, y: 0.740},
							{x: 0.00, y: 0.750},
						])),
					},
					'beard': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.850},
							{x: 0.15, y: 0.820},
							{x: 0.15, y: 0.850},
							{x: 0.10, y: 0.800, d: 1.1},
							{x: 0.00, y: 0.950, d: 1.4},
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

	const HIDE$1 = {
		style: {
			'opacity': 0,
		},
	};

	const EYE_STYLE$1 = {
		'stroke': '#000000',
		'stroke-width': 5,
		'opacity': 1,
	};

	const EYE$1 = pts([{x: 0.25, y: -0.05}, {x: 0.25, y: -0.02}]);

	const CHEEK_STYLE = {
		'stroke': '#F7D1AF',
		'stroke-width': 5,
		'opacity': 1,
	};

	const CHEEK = pts([{x: 0.29, y: 0.08}]);

	const HAIR_STYLE$1 = {
		'stroke': '#202020',
		'stroke-width': 3,
		'fill': '#FFFFFF',
	};

	const MOUSTACHE_NEUTRAL$1 = pts([
		{x: 0.06, y: 0.47},
		{x: 0.13, y: 0.38},
		{x: 0.21, y: 0.33, d: 1.02},
		{x: 0.31, y: 0.33, d: 1.02},
		{x: 0.48, y: 0.33, d: 1.02},
		{x: 0.61, y: 0.34, d: 1.05},
		{x: 0.52, y: 0.45, d: 1.02},
		{x: 0.39, y: 0.53},
		{x: 0.25, y: 0.57},
		{x: 0.16, y: 0.58},
		{x: 0.06, y: 0.55},
	]);

	const MOUSTACHE_SMILE$1 = pts([
		{x: 0.06, y: 0.47},
		{x: 0.13, y: 0.38},
		{x: 0.21, y: 0.33, d: 1.02},
		{x: 0.33, y: 0.31, d: 1.02},
		{x: 0.49, y: 0.29, d: 1.02},
		{x: 0.62, y: 0.29, d: 1.05},
		{x: 0.53, y: 0.43, d: 1.02},
		{x: 0.39, y: 0.52},
		{x: 0.26, y: 0.56},
		{x: 0.16, y: 0.58},
		{x: 0.06, y: 0.55},
	]);

	const MOUSTACHE_SAD$1 = pts([
		{x: 0.06, y: 0.47},
		{x: 0.13, y: 0.38},
		{x: 0.21, y: 0.33, d: 1.02},
		{x: 0.31, y: 0.33, d: 1.02},
		{x: 0.48, y: 0.33, d: 1.02},
		{x: 0.61, y: 0.34, d: 1.05},
		{x: 0.52, y: 0.45, d: 1.02},
		{x: 0.39, y: 0.53},
		{x: 0.25, y: 0.57},
		{x: 0.16, y: 0.58},
		{x: 0.06, y: 0.55},
	]);

	const MOUSTACHE_LAUGH$1 = pts([
		{x: 0.06, y: 0.47},
		{x: 0.13, y: 0.38},
		{x: 0.21, y: 0.33, d: 1.02},
		{x: 0.32, y: 0.28, d: 1.02},
		{x: 0.45, y: 0.24, d: 1.02},
		{x: 0.57, y: 0.25, d: 1.05},
		{x: 0.52, y: 0.39, d: 1.02},
		{x: 0.39, y: 0.49},
		{x: 0.26, y: 0.55},
		{x: 0.16, y: 0.58},
		{x: 0.06, y: 0.55},
	]);

	const MOUSTACHE_SHOCK$1 = pts([
		{x: 0.06, y: 0.47},
		{x: 0.13, y: 0.38},
		{x: 0.21, y: 0.33, d: 1.02},
		{x: 0.31, y: 0.33, d: 1.02},
		{x: 0.48, y: 0.33, d: 1.02},
		{x: 0.61, y: 0.34, d: 1.05},
		{x: 0.52, y: 0.45, d: 1.02},
		{x: 0.39, y: 0.53},
		{x: 0.25, y: 0.57},
		{x: 0.16, y: 0.58},
		{x: 0.06, y: 0.55},
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
				style: EYE_STYLE$1,
				points: reflectX(EYE$1),
			},
			'right-eye': {
				style: EYE_STYLE$1,
				points: EYE$1,
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
					{x: 0.0, y:-0.1, back: true},
					{x: 0.1, y: 0.1, back: true},
					{x:-0.1, y: 0.1, back: true},
				]),
			},
			'hair': {
				style: HAIR_STYLE$1,
				closed: true,
				points: pts([
					{x: 0.09, y: 0.88},
					{x: 0.24, y: 0.83},
					{x: 0.36, y: 0.75},
					{x: 0.46, y: 0.66},
					{x: 0.51, y: 0.52},
					{x: 0.53, y: 0.37},
					{x: 0.49, y: 0.24},
					{x: 0.51, y: 0.14},
					{x: 0.48, y: 0.03},
					{x: 0.48, y:-0.08},
					{x: 0.44, y:-0.18},
					{x: 0.36, y:-0.27},
					{x: 0.27, y:-0.35},
					{x: 0.14, y:-0.40},
					{x: 0.01, y:-0.40},
					{x:-0.13, y:-0.36},
					{x:-0.24, y:-0.33},
					{x:-0.35, y:-0.29},
					{x:-0.41, y:-0.22},
					{x:-0.45, y:-0.16},
					{x:-0.52, y:-0.08},
					{x:-0.52, y: 0.04},
					{x:-0.50, y: 0.17},
					{x:-0.51, y: 0.32},
					{x:-0.52, y: 0.45},
					{x:-0.54, y: 0.56},
					{x:-0.50, y: 0.67},
					{x:-0.38, y: 0.78},
					{x:-0.25, y: 0.86},
					{x:-0.09, y: 0.90},
				]),
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 2,
					'fill': '#FFFFFF',
				},
				closed: true,
				points: symmetricX(backtraced(pts([
					{x: 0.00, y: 0.640},
					{x: 0.10, y: 0.635},
					{x: 0.20, y: 0.620},
					{x: 0.30, y: 0.600},
				]))),
			},
			'beard': {
				style: HAIR_STYLE$1,
				flat: false,
				closed: true,
				points: pts([
					{x: 0.12, y: 0.67},
					{x: 0.25, y: 0.62},
					{x: 0.31, y: 0.59},
					{x: 0.46, y: 0.54},
					{x: 0.54, y: 0.65},
					{x: 0.54, y: 0.65},
					{x: 0.34, y: 0.90, d: 1.1},
					{x: 0.00, y: 0.98, d: 1.1},
					{x:-0.29, y: 0.93, d: 1.1},
					{x:-0.51, y: 0.83},
					{x:-0.61, y: 0.62},
					{x:-0.55, y: 0.51},
					{x:-0.37, y: 0.54},
					{x:-0.22, y: 0.63},
					{x:-0.08, y: 0.67},
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
					{x: 0.0, y: 0.2, d: 1.0},
					{x: 0.0, y: 0.4, d: 1.15},
					{x: 0.0, y: 0.5, d: 1.0},
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
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.650},
							{x: 0.12, y: 0.630},
							{x: 0.24, y: 0.590},
							{x: 0.36, y: 0.520},
						]))),
					},
					'beard': {
						points: pts([
							{x: 0.15, y: 0.64},
							{x: 0.31, y: 0.55},
							{x: 0.39, y: 0.46},
							{x: 0.55, y: 0.48},
							{x: 0.57, y: 0.63},
							{x: 0.53, y: 0.79},
							{x: 0.34, y: 0.88, d: 1.1},
							{x:-0.01, y: 0.96, d: 1.1},
							{x:-0.33, y: 0.91, d: 1.1},
							{x:-0.53, y: 0.81},
							{x:-0.61, y: 0.62},
							{x:-0.60, y: 0.47},
							{x:-0.45, y: 0.46},
							{x:-0.30, y: 0.60},
							{x:-0.08, y: 0.67},
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
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.639},
							{x: 0.10, y: 0.641},
							{x: 0.20, y: 0.645},
							{x: 0.30, y: 0.650},
						]))),
					},
					'beard': {
						points: pts([
							{x: 0.10, y: 0.61},
							{x: 0.22, y: 0.64},
							{x: 0.28, y: 0.64},
							{x: 0.41, y: 0.55},
							{x: 0.53, y: 0.55},
							{x: 0.54, y: 0.65},
							{x: 0.34, y: 0.90, d: 1.1},
							{x: 0.00, y: 0.98, d: 1.1},
							{x:-0.29, y: 0.93, d: 1.1},
							{x:-0.51, y: 0.83},
							{x:-0.61, y: 0.62},
							{x:-0.55, y: 0.53},
							{x:-0.41, y: 0.55},
							{x:-0.26, y: 0.63},
							{x:-0.08, y: 0.60},
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
						points: symmetricX(pts([
							{x: 0.00, y: 0.640},
							{x: 0.10, y: 0.630},
							{x: 0.20, y: 0.610},
							{x: 0.30, y: 0.580},
							{x: 0.20, y: 0.680},
							{x: 0.10, y: 0.760},
							{x: 0.00, y: 0.780},
						])),
					},
					'beard': {
						points: pts([
							{x: 0.08, y: 0.75},
							{x: 0.24, y: 0.67},
							{x: 0.31, y: 0.57},
							{x: 0.46, y: 0.54},
							{x: 0.56, y: 0.58},
							{x: 0.56, y: 0.69},
							{x: 0.34, y: 0.90, d: 1.1},
							{x: 0.00, y: 0.98, d: 1.1},
							{x:-0.29, y: 0.93, d: 1.1},
							{x:-0.51, y: 0.83},
							{x:-0.61, y: 0.62},
							{x:-0.55, y: 0.51},
							{x:-0.37, y: 0.54},
							{x:-0.23, y: 0.69},
							{x:-0.10, y: 0.75},
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
						points: symmetricX(pts([
							{x: 0.00, y: 0.625},
							{x: 0.10, y: 0.630},
							{x: 0.15, y: 0.640},
							{x: 0.20, y: 0.660},
							{x: 0.15, y: 0.700},
							{x: 0.10, y: 0.740},
							{x: 0.00, y: 0.750},
						])),
					},
					'beard': {
						points: pts([
							{x: 0.08, y: 0.75},
							{x: 0.24, y: 0.67},
							{x: 0.31, y: 0.57},
							{x: 0.46, y: 0.54},
							{x: 0.56, y: 0.58},
							{x: 0.56, y: 0.69},
							{x: 0.34, y: 0.90, d: 1.1},
							{x: 0.00, y: 0.98, d: 1.1},
							{x:-0.29, y: 0.93, d: 1.1},
							{x:-0.51, y: 0.83},
							{x:-0.61, y: 0.62},
							{x:-0.55, y: 0.51},
							{x:-0.37, y: 0.54},
							{x:-0.23, y: 0.69},
							{x:-0.10, y: 0.75},
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

	const EYE$2 = pts([{x: 0.3, y: -0.05}]);

	var Clyde = {
		ball: {
			style: {
				'stroke': '#000000',
				'stroke-width': 2,
				'fill': '#FDE8AA',
			},
		},
		liftAngle: Math.PI * 0.07,
		components: {
			'hair': {
				style: {
					'stroke': '#695320',
					'stroke-width': 2,
					'fill': '#C69F45',
				},
				closed: true,
				points: symmetricX(pts([
					{x: 0.00, y: -0.09, back: true},
					{x: 0.20, y: -0.09, back: true},
					{x: 0.40, y: -0.09, back: true},
					{x: 0.60, y: -0.09, back: true},
					{x: 0.80, y: -0.09, back: true},
					{x: 0.90, y: -0.09, back: true},
					{x: 0.95, y: -0.09, back: true},
					{x: 0.97, y: -0.09, back: true},

					{x: 0.99, y: -0.09},
					{x: 0.97, y: -0.10},
					{x: 0.95, y: -0.12},
					{x: 0.93, y: -0.16},
					{x: 0.91, y: -0.18},
					{x: 0.88, y: -0.19},
					{x: 0.85, y: -0.18},
					{x: 0.82, y: -0.16},
					{x: 0.79, y: -0.14},
					{x: 0.76, y: -0.12},
					{x: 0.73, y: -0.11},
					{x: 0.70, y: -0.12},
					{x: 0.67, y: -0.14},
					{x: 0.62, y: -0.18},
					{x: 0.55, y: -0.23},
					{x: 0.48, y: -0.28},
					{x: 0.40, y: -0.32},
					{x: 0.33, y: -0.35},
					{x: 0.24, y: -0.38},
					{x: 0.14, y: -0.40},
					{x: 0.00, y: -0.41},
				])),
			},
			'left-eye': {
				style: EYE_STYLE$2,
				points: reflectX(EYE$2),
			},
			'right-eye': {
				style: EYE_STYLE$2,
				points: EYE$2,
			},
			'nose': {
				style: {
					'stroke': '#000000',
					'stroke-width': 5,
				},
				flat: false,
				points: pts([
					{x: 0.0, y: 0.2, d: 1.0},
					{x: 0.0, y: 0.2, d: 1.2},
				]),
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 2,
					'fill': '#FFFFFF',
				},
				closed: true,
				points: symmetricX(backtraced(pts([
					{x: 0.00, y: 0.640},
					{x: 0.10, y: 0.635},
					{x: 0.20, y: 0.620},
					{x: 0.30, y: 0.600},
				]))),
			},
		},
		mutualExpressions: [
			['normal', 'smile', 'sad', 'laugh', 'shock'],
		],
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
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.650},
							{x: 0.12, y: 0.630},
							{x: 0.24, y: 0.590},
							{x: 0.36, y: 0.520},
						]))),
					},
				},
			},
			'sad': {
				components: {
					'mouth': {
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.639},
							{x: 0.10, y: 0.641},
							{x: 0.20, y: 0.645},
							{x: 0.30, y: 0.650},
						]))),
					},
				},
			},
			'laugh': {
				components: {
					'mouth': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.640},
							{x: 0.10, y: 0.630},
							{x: 0.20, y: 0.610},
							{x: 0.30, y: 0.580},
							{x: 0.20, y: 0.680},
							{x: 0.10, y: 0.760},
							{x: 0.00, y: 0.780},
						])),
					},
				},
			},
			'shock': {
				components: {
					'mouth': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.625},
							{x: 0.10, y: 0.630},
							{x: 0.15, y: 0.640},
							{x: 0.20, y: 0.660},
							{x: 0.15, y: 0.700},
							{x: 0.10, y: 0.740},
							{x: 0.00, y: 0.750},
						])),
					},
				},
			},
		},
	};

	function circle(rad, steps) {
		const result = [];
		for (let i = 0; i < steps; ++ i) {
			const angle = i * Math.PI * 2 / steps;
			result.push({x: Math.sin(angle) * rad, y: -Math.cos(angle) * rad});
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
		for (const pt$$1 of v) {
			pt$$1.y += Math.random() * 0.02 - Math.random() * 0.01;
		}
		return v;
	}

	const HIDE$3 = {
		style: {
			'opacity': 0,
		},
	};

	const EYE_STYLE$3 = {
		'stroke': '#000000',
		'stroke-width': 5,
		'opacity': 1,
	};

	const EYE$3 = pts([{x: 0.3, y: -0.05}, {x: 0.3, y: -0.02}]);

	const EYE_SHADOW_STYLE = {
		'stroke': '#9CBD51',
		'stroke-width': 5,
	};

	const SCAR_BACK_STYLE = {
		'stroke': '#D5CA90',
		'stroke-width': 5,
	};

	const SCAR_STYLE = {
		'stroke': '#C99B72',
		'stroke-width': 2,
	};

	var Halloween = {
		ball: {
			style: {
				'stroke': '#506028',
				'stroke-width': 2,
				'fill': '#CADDA2',
			},
		},
		liftAngle: Math.PI * 0.07,
		components: {
			'hair': {
				style: {
					'stroke': '#826E40',
					'stroke-width': 2,
					'fill': '#B39C65',
				},
				closed: true,
				points: symmetricX(pts(roughY([
					{x: 0.00, y: -0.09, back: true},
					{x: 0.20, y: -0.09, back: true},
					{x: 0.40, y: -0.09, back: true},
					{x: 0.60, y: -0.09, back: true},
					{x: 0.80, y: -0.09, back: true},
					{x: 0.90, y: -0.09, back: true},
					{x: 0.95, y: -0.09, back: true},
					{x: 0.97, y: -0.09, back: true},

					{x: 0.99, y: -0.09},
					{x: 0.97, y: -0.10},
					{x: 0.95, y: -0.12},
					{x: 0.93, y: -0.16},
					{x: 0.91, y: -0.18},
					{x: 0.88, y: -0.19},
					{x: 0.85, y: -0.18},
					{x: 0.82, y: -0.16},
					{x: 0.79, y: -0.14},
					{x: 0.76, y: -0.12},
					{x: 0.73, y: -0.11},
					{x: 0.70, y: -0.12},
					{x: 0.67, y: -0.14},
					{x: 0.62, y: -0.18},
					{x: 0.55, y: -0.23},
					{x: 0.48, y: -0.28},
					{x: 0.40, y: -0.32},
					{x: 0.33, y: -0.35},
					{x: 0.24, y: -0.38},
					{x: 0.14, y: -0.40},
					{x: 0.00, y: -0.41},
				]))),
			},
			'left-eye-shadow': {
				style: EYE_SHADOW_STYLE,
				points: pts([
					{x: -0.35, y: -0.14},
					{x: -0.25, y: -0.12},
				]),
			},
			'right-eye-shadow': {
				style: EYE_SHADOW_STYLE,
				points: pts([
					{x: 0.35, y: -0.14},
					{x: 0.25, y: -0.12},
				]),
			},
			'left-eye': {
				style: EYE_STYLE$3,
				points: reflectX(EYE$3),
			},
			'right-eye': {
				style: EYE_STYLE$3,
				points: EYE$3,
			},
			'right-cheek-scar-shade': {
				style: SCAR_BACK_STYLE,
				points: pts([
					{x: 0.6, y: 0.5},
					{x: 0.7, y: 0.2},
				]),
			},
			'right-cheek-scar-shade-stitch-1': {
				style: SCAR_BACK_STYLE,
				points: pts([
					{x: 0.55, y: 0.4},
					{x: 0.7, y: 0.45},
				]),
			},
			'right-cheek-scar-shade-stitch-2': {
				style: SCAR_BACK_STYLE,
				points: pts([
					{x: 0.6, y: 0.3},
					{x: 0.72, y: 0.35},
				]),
			},
			'right-cheek-scar-shade-stitch-3': {
				style: SCAR_BACK_STYLE,
				points: pts([
					{x: 0.65, y: 0.2},
					{x: 0.75, y: 0.25},
				]),
			},
			'right-cheek-scar': {
				style: SCAR_STYLE,
				points: pts([
					{x: 0.6, y: 0.5},
					{x: 0.7, y: 0.2},
				]),
			},
			'right-cheek-scar-stitch-1': {
				style: SCAR_STYLE,
				points: pts([
					{x: 0.55, y: 0.4},
					{x: 0.7, y: 0.45},
				]),
			},
			'right-cheek-scar-stitch-2': {
				style: SCAR_STYLE,
				points: pts([
					{x: 0.6, y: 0.3},
					{x: 0.72, y: 0.35},
				]),
			},
			'right-cheek-scar-stitch-3': {
				style: SCAR_STYLE,
				points: pts([
					{x: 0.65, y: 0.2},
					{x: 0.75, y: 0.25},
				]),
			},
			'nose': {
				style: {
					'stroke': '#000000',
					'stroke-width': 5,
				},
				flat: false,
				points: pts([
					{x: 0.0, y: 0.2, d: 1.0},
					{x: 0.0, y: 0.2, d: 1.1},
				]),
			},
			'mouth-shadow': {
				style: {
					'stroke': '#9CBD51',
					'stroke-width': 4,
					'fill': '#9CBD51',
				},
				closed: true,
				points: pts([
					{x: 0.00, y: 0.47},
					{x: 0.10, y: 0.48},
					{x: 0.20, y: 0.50},
					{x: 0.35, y: 0.60},
					{x: 0.30, y: 0.75},
					{x: 0.20, y: 0.85},
					{x: 0.10, y: 0.80},
					{x: 0.00, y: 0.90},
					{x:-0.10, y: 0.80},
					{x:-0.20, y: 0.75},
					{x:-0.30, y: 0.67},
					{x:-0.35, y: 0.60},
					{x:-0.20, y: 0.50},
					{x:-0.10, y: 0.48},
				]),
			},
			'mouth': {
				style: {
					'stroke': '#000000',
					'stroke-width': 2,
					'fill': '#77100E',
				},
				closed: true,
				points: symmetricX(backtraced(pts([
					{x: 0.00, y: 0.640},
					{x: 0.10, y: 0.635},
					{x: 0.20, y: 0.620},
					{x: 0.30, y: 0.600},
				]))),
			},
		},
		mutualExpressions: [
			['normal', 'smile', 'sad', 'laugh', 'shock'],
		],
		expressions: {
			'eyes-closed': {
				components: {
					'left-eye': HIDE$3,
					'right-eye': HIDE$3,
				},
			},
			'smile': {
				components: {
					'mouth-shadow': {
						points: pts([
							{x: 0.00, y: 0.45},
							{x: 0.10, y: 0.44},
							{x: 0.30, y: 0.44},
							{x: 0.40, y: 0.46},
							{x: 0.30, y: 0.75},
							{x: 0.20, y: 0.85},
							{x: 0.10, y: 0.80},
							{x: 0.00, y: 0.90},
							{x:-0.10, y: 0.80},
							{x:-0.20, y: 0.75},
							{x:-0.30, y: 0.67},
							{x:-0.40, y: 0.46},
							{x:-0.30, y: 0.44},
							{x:-0.10, y: 0.44},
						]),
					},
					'mouth': {
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.650},
							{x: 0.20, y: 0.630},
							{x: 0.30, y: 0.590},
							{x: 0.36, y: 0.520},
						]))),
					},
				},
			},
			'sad': {
				components: {
					'mouth-shadow': {
						points: pts([
							{x: 0.00, y: 0.47},
							{x: 0.10, y: 0.48},
							{x: 0.20, y: 0.55},
							{x: 0.35, y: 0.65},
							{x: 0.30, y: 0.75},
							{x: 0.20, y: 0.85},
							{x: 0.10, y: 0.80},
							{x: 0.00, y: 0.90},
							{x:-0.10, y: 0.80},
							{x:-0.20, y: 0.75},
							{x:-0.30, y: 0.67},
							{x:-0.35, y: 0.65},
							{x:-0.20, y: 0.55},
							{x:-0.10, y: 0.48},
						]),
					},
					'mouth': {
						points: symmetricX(backtraced(pts([
							{x: 0.00, y: 0.639},
							{x: 0.10, y: 0.641},
							{x: 0.20, y: 0.645},
							{x: 0.30, y: 0.650},
						]))),
					},
				},
			},
			'laugh': {
				components: {
					'mouth-shadow': {
						points: pts([
							{x: 0.00, y: 0.47},
							{x: 0.10, y: 0.48},
							{x: 0.20, y: 0.50},
							{x: 0.35, y: 0.60},
							{x: 0.30, y: 0.75},
							{x: 0.20, y: 0.85},
							{x: 0.10, y: 0.80},
							{x: 0.00, y: 0.90},
							{x:-0.10, y: 0.80},
							{x:-0.20, y: 0.75},
							{x:-0.30, y: 0.67},
							{x:-0.35, y: 0.60},
							{x:-0.20, y: 0.50},
							{x:-0.10, y: 0.48},
						]),
					},
					'mouth': {
						points: pts([
							{x: 0.00, y: 0.600},
							{x: 0.20, y: 0.600},
							{x: 0.25, y: 0.610},
							{x: 0.30, y: 0.650},
							{x: 0.20, y: 0.700},
							{x: 0.10, y: 0.720},
							{x: 0.00, y: 0.730},
							{x:-0.10, y: 0.720},
							{x:-0.20, y: 0.700},
							{x:-0.30, y: 0.650},
							{x:-0.25, y: 0.620},
							{x:-0.20, y: 0.610},
						]),
					},
				},
			},
			'shock': {
				components: {
					'mouth-shadow': {
						points: pts([
							{x: 0.00, y: 0.47},
							{x: 0.10, y: 0.48},
							{x: 0.20, y: 0.50},
							{x: 0.35, y: 0.60},
							{x: 0.30, y: 0.75},
							{x: 0.20, y: 0.85},
							{x: 0.10, y: 0.80},
							{x: 0.00, y: 0.90},
							{x:-0.10, y: 0.80},
							{x:-0.20, y: 0.75},
							{x:-0.30, y: 0.67},
							{x:-0.35, y: 0.60},
							{x:-0.20, y: 0.50},
							{x:-0.10, y: 0.48},
						]),
					},
					'mouth': {
						points: symmetricX(pts([
							{x: 0.00, y: 0.625},
							{x: 0.10, y: 0.630},
							{x: 0.15, y: 0.640},
							{x: 0.20, y: 0.660},
							{x: 0.15, y: 0.700},
							{x: 0.10, y: 0.740},
							{x: 0.00, y: 0.750},
						])),
					},
				},
			},
		},
	};

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

	var skins = {
		Bonfire,
		Christmas,
		Clyde,
		Eye,
		Halloween,
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
	}

}());
