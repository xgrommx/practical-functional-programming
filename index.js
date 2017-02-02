const {B, K, C, I} = require('./combinators');

// pure, return
const of = T => value => T.of(value);
// map, fmap, <$>, liftM, liftA
const map = f => source => {
    if(source.map) return source.map(f);
    if(source.ap) return ap(source.constructor.of(f))(source);
    if(source.chain) return chain_(B(source.constructor.of)(f))(source);
};
// <&>
const flippedMap = C(map);
// <$
const mapLeft = B(map)(K);
// $>
// const mapRight = xs => value => map(K(value))(xs);
const mapRight = C(mapLeft);
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
const concatAll = (empty, xs) => {
    if(xs.concatAll) return xs.concatAll(T);
    if(xs.foldr) return xs.foldr((x, acc) => x.concat(acc), empty());
};
// foldr
const foldr = f => z => xs => xs.foldr(f, z);
// foldl
const foldl = f => z => xs => xs.foldl(f, z);
// foldMap
const foldMap = (empty, f) => xs => {
    if(xs.foldMap) return xs.foldMap(empty, f);
    if(xs.foldr) return foldr((x, acc) => f(x).concat(acc))(empty())(xs);
};
// fold
const fold = (empty, xs) => {
    if(xs.fold) return xs.fold(empty);
    if(xs.foldMap) return xs.foldMap(empty, I);
};
// liftA, map
const liftM = f => x => x.chain(_ => x.constructor.of(f(_)));
// liftA2, liftM2
const liftM2 = f => x => y => x.chain(a => y.chain(b => x.constructor.of(f(a)(b))));
// ap, <*>
const apM = x => y => x.chain(f => y.chain(v => x.constructor.of(f(v))));
// Foldable
const traverse_ = (of, f) => foldr((x, acc) => f(x).apR(acc))(of(void 0));
const for_ = xs => (of, f) => traverse_(of, f)(xs);
const mapM_ = (of, f) => foldr((x, acc) => f(x).then(acc))(of(void 0));
const forM_ = xs => (of, f) => mapM_(of, f)(xs);
const sequenceA_ = (of, f) => foldr((x, acc) => x.apR(acc))(of(void 0));
const sequence_ = (of, f) => foldr((x, acc) => x.then(acc))(of(void 0));
// Traversable
const traverse = (of, f) => xs => xs.traverse(of, f);
const sequence = (of, xs) => {
    if(xs.sequence) return xs.sequence(of);
if(xs.traverse) return xs.traverse(of, I);
};
const mapM = traverse;
const _for = xs => (of, f) => traverse(of, f);
const forM = xs => (of, f) => mapM(of, f);

const foldrM = of => (f, z, xs) => {
    const f_ = (k, x) => z => chain_(k)(f(x, z));
    return foldl(f_)(of)(xs)(z)
};

const foldlM = of => (f, z, xs) => {
    const f_ = (x, k) => z => chain_(k)(f(z, x));
    return foldr(f_)(of)(xs)(z)
};

const foldM = foldlM;

const foldM_ = of => (f, z, xs) => then(of(void 0))(foldrM(of)(f, z, xs));
const replicate = (n, v) => Array.from(Array(n), K(v));
const replicateM = (of, n) => v => sequence(of, replicate(n, v));

module.exports = {
    of, map, chain, chain_,
    ap, apRight, apLeft, mapRight,
    liftA, liftM, liftA2, liftM2,
    flippedAp, then, join, concat, concatAll,
    foldr, foldl, foldMap, fold, apM,
    traverse_, for_, mapM_, forM_, sequenceA_,
    sequence_, traverse, sequence, mapM, _for,
    forM, foldrM, foldlM, foldM, foldM_, replicate,
    replicateM, mapLeft
};
