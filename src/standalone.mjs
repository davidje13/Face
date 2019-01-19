import Face from './face/Face.mjs';
import skins from './skins/all.mjs';

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
