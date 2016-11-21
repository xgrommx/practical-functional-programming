const Type = require('union-type');
const {K, I} = require('../combinators');
const {liftA2, map, ap, foldMap, traverse} = require('../');

const _Compose = Type({
    Compose: [K(true)]
});

const {Compose} = _Compose;

// Pointed
Compose.of = (T1, T2, x) => Compose(T1.of(T2.of(x)));
// Monoid, Alternative
Compose.empty = T => Compose(T.empty());

Object.assign(_Compose.prototype, {
    // Alternative
    alt(c) { return Compose(this.getCompose().alt(c.getCompose())) },
    // Functor
    map(f) { return Compose(B(map)(map)(f)(this.getCompose())) },
    // Applicative
    ap(m) { return Compose(liftA2(ap)(this.getCompose())(m.getCompose())) },
    // Traversable
    traverse(T, f) { return map(x => Compose(x))(traverse(T, traverse(T, f))(this.getCompose())) },
    // Foldable
    foldMap(T, f) { return foldMap(T, foldMap(T, f))(this.getCompose()) },
    getCompose() { return this.case({Compose: I}) }
});

module.exports = { Compose };