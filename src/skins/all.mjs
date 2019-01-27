import Bonfire from './Bonfire.mjs';
import Christmas from './Christmas.mjs';
import Doe from './Doe.mjs';
import Eye from './Eye.mjs';
import Halloween from './Halloween.mjs';
import TestPattern from './TestPattern.mjs';

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

const Eve = new Doe({
	skin: Doe.skin({european: 0.5, african: 0.5, pale: 0.2}),
	hair: Doe.HAIR.WHITE,
	hairStyle: Doe.HAIR_STYLE.PARTED_BUN,
});

export default {
	Amy,
	Bert,
	Bonfire,
	Christmas,
	Clyde,
	Dean,
	Doe,
	Eve,
	Eye,
	Halloween,
	HalloweenAmy: new Halloween(Amy),
	HalloweenBert: new Halloween(Bert),
	HalloweenClyde: new Halloween(Clyde),
	HalloweenDean: new Halloween(Dean),
	HalloweenEve: new Halloween(Eve),
	TestPattern,
};
