import {buildHat, renderHat} from './svgHatRendering.mjs';
import {
	fxShort,
	renderLines,
	renderLinesHemi,
	renderOnBall,
} from './svgBallRendering.mjs';
import DOMWrapper from '../core/DOMWrapper.mjs';
import {VirtualDocument} from '../core/documents/VirtualDocument.mjs';

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

function applyMat(v, m) {
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
	/* eslint-disable-next-line no-warning-comments */
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

function copyPoint({x, y, z}) {
	return {x, y, z};
}

const NS = 'http://www.w3.org/2000/svg';
const XLNS = 'http://www.w3.org/1999/xlink';

function buildComponents(dom, root, components, minBackStroke) {
	const result = new Map();
	for (const part in components) {
		if (!has(components, part)) {
			continue;
		}
		const component = components[part];
		const isBlob = Boolean(component.blob);
		const defaultBackRendering = (
			Boolean(component.styleBack) ||
			isBlob ||
			(component.flat === false) ||
			Number((component.style || {})['stroke-width']) > minBackStroke
		);
		const details = {
			info: Object.assign({
				backRendering: defaultBackRendering,
				frontRendering: true,
				isBlob,
			}, component),
			points: component.points.map(copyPoint),
		};
		if (isBlob) {
			const blobID = 'face-blob-' + part;
			details.elBack = dom.el('g', NS);
			details.elFront = dom.el('g', NS);
			details.blobs = component.points.map(() => dom.el('use', NS)
				.attr('href', '#' + blobID, XLNS));
			const symbol = dom.el('symbol', NS).attrs({
				'id': blobID,
				'overflow': 'visible',
			});
			component.blob(symbol, dom);
			root.add(symbol);
		} else {
			details.elBack = dom.el('path', NS).attr('fill-rule', 'evenodd');
			details.elFront = dom.el('path', NS).attr('fill-rule', 'evenodd');
		}
		result.set(part, details);
		root.unshift(details.elBack);
		root.add(details.elFront);
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
					` (${points.length} != ${base.points.length})`,
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

function mirrorPointsZ(v) {
	const result = v.map((p) => ({x: p.x, y: p.y, z: -p.z}));
	result.reverse();
	return result;
}

export default class Face {
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
		let resolvedSkin = skin;
		if (typeof skin === 'string') {
			resolvedSkin = Face.skins[skin];
			if (!resolvedSkin) {
				throw new Error('Unknown skin: ' + skin);
			}
		}
		if (typeof resolvedSkin !== 'object') {
			throw new Error('Invalid skin');
		}
		const {
			ball = {},
			liftAngle = 0,
			hat = null,
			components = {},
			expressions = {},
		} = resolvedSkin;

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
		this.root = this.dom.el('svg', NS).attrs({
			'height': fxSize,
			'version': '1.1',
			'viewBox': `${fxLeft} ${fxTop} ${fxBounds} ${fxBounds}`,
			'width': fxSize,
			'xmlns': NS,
			'xmlns:xlink': XLNS,
		});
		this.ball = this.dom.el('circle', NS).attrs({
			'cx': '0',
			'cy': '0',
			'r': fxShort(radius),
		});
		this.root.add(this.ball);

		const minBackStroke = Number(ball.style['stroke-width']) || 0;
		this.components = buildComponents(
			this.dom,
			this.root,
			components,
			minBackStroke,
		);
		this.expressionInfo = readExpressions(expressions, this.components);

		if (hat) {
			this.hatInfo = {
				brim: Object.assign({
					innerRadius: 0,
					outerRadius: 0,
					style: {},
				}, hat.brim),
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

	setRotation(rawX, rawY) {
		let x = rawX;
		let y = rawY;
		if (typeof rawX === 'object') {
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
			(name) => this.expressionInfo.get(name).ball.style,
		)));
		for (const [part, {info, points, elFront, elBack}] of this.components.entries()) {
			const frontAttrs = blendStyles(blendedParts(
				this.expression,
				info.style,
				(name) => (this.expressionInfo.get(name).components[part] || {}).style,
			));
			elFront.attrs(frontAttrs);

			let backStyle = info.styleBack;
			if (!backStyle) {
				backStyle = Object.assign({}, info.style, {'fill': 'none'});
			}

			const backAttrs = blendStyles(blendedParts(
				this.expression,
				backStyle,
				(name) => {
					const base = this.expressionInfo.get(name).components[part] || {};
					return base.styleBack || base.style;
				},
			));
			elBack.attrs(backAttrs);

			blendPoints(points, blendedParts(
				this.expression,
				info.points,
				(name) => (this.expressionInfo.get(name).components[part] || {}).points,
			));

			info.frontFilled = frontAttrs['fill'] !== 'none';
			info.backFilled = backAttrs['fill'] !== 'none';
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
		for (const [, {info, points, elFront, elBack, blobs}] of this.components.entries()) {
			if (!points.length) {
				continue;
			}
			const viewPoints = points.map((p) => applyMat(p, this.mat));
			if (info.isBlob) {
				elFront.empty();
				elBack.empty();
				viewPoints.sort((a, b) => (a.z - b.z));
				for (let i = 0; i < viewPoints.length; ++ i) {
					const pt = viewPoints[i];
					const el = blobs[i];
					el.attrs({'x': pt.x, 'y': pt.y});
					if (pt.z < 0) {
						if (info.backRendering) {
							elBack.add(el);
						}
					} else if (info.frontRendering) {
						elFront.add(el);
					}
				}
				continue;
			}
			const opts = {
				closed: info.closed,
				filled: info.frontFilled,
				pointsAsLines: this.pointsAsLines,
				radius: this.radius,
			};
			let dFront = '';
			let dBack = '';
			if (info.flat === false) {
				if (info.frontFilled) {
					dFront = renderLines(viewPoints, opts);
				} else {
					if (info.frontRendering) {
						dFront = renderLinesHemi(viewPoints, opts);
					}
					if (info.backRendering) {
						dBack = renderLinesHemi(mirrorPointsZ(viewPoints), opts);
					}
				}
			} else {
				if (info.frontRendering) {
					dFront = renderOnBall(viewPoints, opts);
				}
				if (info.backRendering) {
					opts.filled = info.backFilled;
					dBack = renderOnBall(mirrorPointsZ(viewPoints), opts);
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

function renderFace(options) {
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
		expressions: {[ds.faceExpression]: 1},
		padding: readNumber(ds.facePadding),
		radius: readNumber(ds.faceRadius),
		rotation: {
			x: readNumber(ds.faceRotateX, 0) * Math.PI / 180,
			y: readNumber(ds.faceRotateY, 0) * Math.PI / 180,
		},
		shift: {
			x: readNumber(ds.faceShiftX, 0),
			y: readNumber(ds.faceShiftY, 0),
		},
		skin: ds.faceSkin || 'Clyde',
		zoom: readNumber(ds.faceZoom),
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
			attrs[i].nodeValue,
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
	render: renderFace,
	skins: {},
});
