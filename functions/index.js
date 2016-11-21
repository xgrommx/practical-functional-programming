const {S, B, K, W__, Q} = require('../combinators');
const {liftA2, concat} = require('../');

// Pointed
Function.of = K;
// Monoid
Function.empty = T => K(T.empty());

Object.assign(Function.prototype, {
    // Functor
    map(f) { return B(this)(f) },
    // Applicative
    ap(m) { return S(this)(m) },
    // Monad
    chain(f) { return W__(Q)(this)(f) },
    // Monoid
    concat(m){ return liftA2(concat)(this)(m); }
});

