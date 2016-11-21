const {K} = require('../combinators');
const {chain_, liftA2, map} = require('../');

Array.empty = K([]);

Object.assign(Array.prototype, {
    // Monad
    chain(f) {
        return [].concat(...map(v => f(v))(this));
    },
    // Applicative
    ap(m) {
        return chain_(f => map(v => f(v))(m))(this);
    },
    // Foldable
    foldr(f, z) {
        return this.reduceRight((acc, next) => f(next, acc), z);
    },
    // Foldable
    foldl(f, z) {
        return this.reduce((acc, next) => f(acc, next), z);
    },
    // Traversable
    traverse(of, f) {
        return this.foldr((x, ys) => liftA2(a => b => [a, ...b])(f(x))(ys), of([]))
    }
});