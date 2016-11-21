const Type = require('union-type');
const {K, B, I} = require('../combinators');

// data Maybe a = Nothing | Just a
const Maybe = Type({
    Nothing: [],
    Just: [K(true)]
});

const {Just, Nothing} = Maybe;

// Pointed
Maybe.of = Just;
// Monoid
Maybe.empty = Nothing;

Object.assign(Maybe.prototype, {
    // Monad
    chain(f) { return this.maybe(Nothing(), f) },
    // Functor
    map(f) { return this.chain(B(v => Maybe.of(v))(f)) },
    // Applicative
    ap(m) { return this.chain(f => m.map(v => f(v))) },
    // Foldable
    foldr(f, z) { return this.maybe(z, x => f(x, z)) },
    // Foldable
    foldl(f, z) { return this.maybe(z, x => f(z, x)) },
    // Traversable
    traverse(T, f) { return this.maybe(T.of(Nothing()), B(map(v => Maybe.of(v)))(f)) },
    // Monoid
    concat(m) { return this.isNothing() ? m : m.isNothing() ? this : this.fromJust().concat(m.fromJust()) },
    fromJust() { return this.case({Just: I}) },
    isJust() { return this.maybe(false, K(true)) },
    isNothing() { return !this.isJust() },
    getOrElse(d) { return this.maybe(d, I) },
    maybe(d, f) { return this.case({Just: v => f(v), Nothing: _ => d}) }
});

module.exports = { Maybe, Just, Nothing };