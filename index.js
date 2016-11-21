const {B, K, C, I} = require('./combinators');

// pure, return
const of = T => value => T.of(value);
// map, fmap, <$>, liftM, liftA
const map = f => source => {
    if(source.map) return source.map(f);
    if(source.ap) return ap(source.constructor.of(f))(source);
    if(source.chain) return chain_(B(source.constructor.of)(f))(source);
};
// $>
const mapRight = xs => value => map(K(value))(xs);
// <*>, ap
const ap = source => m => {
    if(source.ap) return source.ap(m);
    if(source.chain) return chain_(f => map(v => f(v))(m))(source);
};
// liftA, liftM
const liftA = f => x => ap(x.constructor.of(f))(x);
// liftA2, liftM2
const liftA2 = f => x => y => x.map(f).ap(y);
// *>, >>
const apRight = liftA2(K(I));
// <*
const apLeft = liftA2(K);
// <**>
const flippedAp = liftA2(C(I));
// >>=
const chain = source => f => source.chain(f);
// =<<
const chain_ = C(chain);
// >>, *>
const then = m => chain_(K(m));
// join
const join = xss => chain_(I)(xss);
// mappend
const concat = x => y => x.concat(y);
// mconcat
const concatAll = (T, xs) => {
    if(xs.concatAll) return xs.concatAll(T);
    if(xs.foldr) return xs.foldr((x, acc) => x.concat(acc), T.empty());
};
// foldr
const foldr = f => z => xs => xs.foldr(f, z);
// foldl
const foldl = f => z => xs => xs.foldl(f, z);
// foldMap
const foldMap = (T, f = false) => xs => {
    if(xs.foldMap) return xs.foldMap(T, f || T);
    if(xs.foldr) return foldr((x, acc) => f(x).concat(acc))(T.empty())(xs);
};
// fold
const fold = (T, xs) => {
    if(xs.fold) return xs.fold(T);
    if(xs.foldMap) return xs.foldMap(T, I);
};
// liftA, map
const liftM = f => x => x.chain(_ => x.constructor.of(f(_)));
// liftA2, liftM2
const liftM2 = f => x => y => x.chain(a => y.chain(b => x.constructor.of(f(a)(b))));
// ap, <*>
const apM = x => y => x.chain(f => y.chain(v => x.constructor.of(f(v))));
// Foldable
const traverse_ = (T, f) => foldr((x, acc) => f(x).apR(acc))(T.of(void 0));
const for_ = xs => (T, f) => traverse_(T, f)(xs);
const mapM_ = (T, f) => foldr((x, acc) => f(x).then(acc))(T.of(void 0));
const forM_ = xs => (T, f) => mapM_(T, f)(xs);
const sequenceA_ = (T, f) => foldr((x, acc) => x.apR(acc))(T.of(void 0));
const sequence_ = (T, f) => foldr((x, acc) => x.then(acc))(T.of(void 0));
// Traversable
const traverse = (T, f) => xs => xs.traverse(T, f);
const sequence = (T, xs) => {
    if(xs.sequence) return xs.sequence(T);
    if(xs.traverse) return xs.traverse(T, I);
};
const mapM = traverse;
const _for = xs => (T, f) => traverse(T, f);
const forM = xs => (T, f) => mapM(T, f);

const foldrM = T => (f, z, xs) => {
    const f_ = (k, x) => z => chain_(k)(f(x, z));
    return foldl(f_)(T.of)(xs)(z)
};

const foldlM = T => (f, z, xs) => {
    const f_ = (x, k) => z => chain_(k)(f(z, x));
    return foldr(f_)(T.of)(xs)(z)
};

const foldM = foldlM;

const foldM_ = T => (f, z, xs) => then(T.of(void 0))(foldrM(T)(f, z, xs));
const replicate = (n, v) => Array.from(Array(n), K(v));
const replicateM = (T, n) => v => sequence(T, replicate(n, v));

module.exports = {
    of, map, chain, chain_,
    ap, apRight, apLeft, mapRight,
    liftA, liftM, liftA2, liftM2,
    flippedAp, then, join, concat, concatAll,
    foldr, foldl, foldMap, fold, apM,
    traverse_, for_, mapM_, forM_, sequenceA_,
    sequence_, traverse, sequence, mapM, _for,
    forM, foldrM, foldlM, foldM, foldM_, replicate,
    replicateM
};