import DOMWrapper from './DOMWrapper.js';
import {renderOnBall, renderLines, fxShort} from './svgBallRendering.js';

function has(o, key) {
	return Object.prototype.hasOwnProperty.call(o, key);
}

function viewMat(x, y, r) {
	const s1 = Math.sin(y);
	const c1 = Math.cos(y);
	const s2 = Math.sin(x);
	const c2 = Math.cos(x);
	return [
		 c2 * r, -s1 * s2 * r, c1 * s2 * r,
		  0 * r,  c1      * r, s1      * r,
		-s2 * r, -s1 * c2 * r, c1 * c2 * r,
	];
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
			all.push({v, proportion});
			total += proportion;
		}
	}
	if (total < 1) {
		all.push({v: base, proportion: 1 - total});
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
	return Object.assign({}, ...(all.map(({v}) => v)));
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

const NS = 'http://www.w3.org/2000/svg';

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
				throw `error: part "${part}" defined in "${name}" but not in base`;
			}
			const points = info.components[part].points;
			if (points && points.length !== base.points.length) {
				throw (
					`error: part "${part}" points mismatch in "${name}"` +
					` (${points.length} != ${base.points.length})`
				);
			}
		}

		result.set(name, info);
	}
	return result;
}

export default class Face {
	static rotationForDirection(dx, dy, dz) {
		const x = Math.atan2(dx, dz);
		const y = Math.atan2(Math.cos(x) * dy, dz);
		return {x, y};
	}

	constructor({
		topography: {
			ball = {},
			liftAngle = 0,
			components = {},
			expressions = {},
		},
		radius = 100,
		padding = 0,
		zoom = 1,
		document = null,
		container = null,
	}) {
		if (document === null) {
			if (container === null) {
				document = window.document;
			} else {
				document = container.ownerDocument;
			}
		}

		this.dom = new DOMWrapper(document);
		this.ballInfo = ball;
		this.liftAngle = liftAngle;
		this.radius = radius;
		this.expression = new Map();
		this.currentRotation = {x: null, y: null};
		this.mat = [];
		this.dirty = true;

		const size = radius + padding;

		const fxSize = fxShort(size * zoom * 2);
		const fxLeft = fxShort(-size);
		const fxBounds = fxShort(size * 2);
		this.root = this.dom.el('svg', NS).attrs({
			'xmlns': NS,
			'version': '1.1',
			'width': fxSize,
			'height': fxSize,
			'viewBox': `${fxLeft} ${fxLeft} ${fxBounds} ${fxBounds}`,
		});
		this.ball = this.dom.el('circle', NS).attrs({
			'cx': '0',
			'cy': '0',
			'r': fxShort(radius),
		});
		this.root.add(this.ball);

		this.components = new Map();
		for (const part in components || {}) {
			if (!has(components, part)) {
				continue;
			}
			const info = components[part];
			const points = info.points.map(({x, y, z}) => ({x, y, z})); // make copy
			const el = this.dom.el('path', NS).attr('fill-rule', 'evenodd');
			this.components.set(part, {info, points, el});
			this.root.add(el);
		}
		this.expressionInfo = readExpressions(expressions, this.components);

		this.setRotation(0, 0);
		this._updateExpression();

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

	setExpressions(proportions) {
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
		if (changed || toRemove.size > 0) {
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
		for (const [part, {info, points, el}] of this.components.entries()) {
			el.attrs(blendStyles(blendedParts(
				this.expression,
				info.style,
				(name) => (this.expressionInfo.get(name).components[part] || {}).style
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
			return;
		}
		for (const [part, {info, points, el}] of this.components.entries()) {
			const viewPoints = points.map((p) => applyMat(p, this.mat));
			let d;
			if (info.flat === false) {
				d = renderLines(viewPoints, {closed: info.closed});
			} else {
				d = renderOnBall(viewPoints, {
					radius: this.radius,
					filled: Boolean(info.style.fill),
					closed: info.closed
				});
			}
			el.attr('d', d);
		}
		this.dirty = false;
	}
}
