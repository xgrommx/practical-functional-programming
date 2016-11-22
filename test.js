require('./array');
require('./functions');

const {K, B, I} = require('./combinators');
const {Maybe, Just, Nothing} = require('./maybe');
const {Either, Left, Right} = require('./either');
const {Compose} = require('./compose');

const {foldMap, replicateM, mapLeft, mapRight, traverse, liftA2} = require('.');

console.log(
    // foldMap(Array, Array.of)(Compose([Just(10), Just(20), Nothing()])),
    // replicateM(Array, 2)([1, 2, 3]),
    mapRight([1,2,3])([4]),
    mapLeft([1,2,3])([4])
);

const Type = require('union-type');

const _Identity = Type({
   Identity: [K(true)]
});

const {Identity} = _Identity;

Identity.of = Identity;

Object.assign(_Identity.prototype, {
    getIdentity() { return this.case({ Identity: I }) },
    map(f) { return Identity(f(this.getIdentity())) },
    ap(m) { return Identity(this.getIdentity()(m.getIdentity())) }
});

const _Const = Type({
    Const: [K(true)]
});

const {Const} = _Const;

Const.of = Const;

Object.assign(_Const.prototype, {
    getConst() { return this.case({ Const: I }) },
    map() { return this },
    ap(m) { return Const(this.getConst().concat(m.getConst())) }
});

const foldMapDefault = (T, f) => xs => traverse(K(Const.of(T.empty())), B(Const)(f))(xs).getConst();

console.log(
    foldMapDefault(Array, Array.of)(Compose([Just(10), Just(20), Nothing()]))
);

const fmapDefault = (T, f) => xs => traverse(K(Identity.of(T.empty())), B(Identity)(f))(xs).getIdentity();

console.log(
    B(foldMapDefault(Array, Array.of))(fmapDefault(Maybe, x => x * 10))(Compose([Just(10), Just(20), Nothing()]))
);
