require('./array');

const { liftA2, foldr, concat, sequence, map } = require('.')
const { K, B, I } = require('./combinators')
const { Just, Nothing } = require('./maybe')
const { Sum } = require('./sum')

// Basic idea from https://www.stackage.org/haddock/lts-8.5/foldl-1.2.3/Control-Foldl.html

// data Fold a b = Fold (x -> a -> x) x (x -> b)
const Fold = (step, begin, done) => ({
  step, // step :: (x, a) -> x
  begin, // begin :: x
  done, // done :: x -> b
  map(f) {
    return Fold(step, begin, B(f)(done))
  },
  lmap(f) {
    return Fold((x, a) => step(x, f(a)), begin, done)
  },
  rmap(f) {
    return this.map(f)
  },
  concat(m) {
    return liftA2(concat)(this)(m)
  },
  ap({ step:stepR, begin:beginR, done:doneR }) {
    const newStep = ([x, y], a) => [step(x, a), stepR(y, a)]
    const newBegin = [begin, beginR]
    const newDone = ([x, y]) => done(x)(doneR(y))

    return Fold(newStep, newBegin, newDone)
  },
  fold(as) {
    return foldr((a, k) => x => k(step(x, a)))(done)(as)(begin)
  },
  scan(as) {
    return foldr((a, k) => x => [].concat(done(x), k(step(x, a))))(x => [done(x)])(as)(begin)
  }
})

const Fold1_= step => Fold((a, b) => Just(a.maybe(b, x => step(x, b))), Nothing(), I)

Fold.fold = (f, xs) => f.fold(xs)
Fold.scan = (f, xs) => f.scan(xs)
Fold.empty = T => Fold.of(T.empty())
Fold.of = x => Fold(K(null), null, K(x))
Fold.sum = Fold((x, y) => x + y, 0, I)
Fold.product = Fold((x, y) => x * y, 1, I)
Fold.genericLength = Fold((n, _) => n + 1, 0, I)
Fold.concatAll = T => Fold((a, b) => concat(a)(b), T.empty(), I)
Fold.min = Fold1_((a, b) => Math.min(a, b))
Fold.max = Fold1_((a, b) => Math.max(a, b))
Fold.foldMap = (m, f, e) => Fold((x, a) => concat(x)(f(a)), m.empty(), e)

const range = n => Array.from({length: n}, (_, i) => i + 1)

const average = liftA2(x => y => x / y)(Fold.sum)(Fold.genericLength)

console.log(
  average.fold(range(15000)),
  Fold.sum.scan(range(10)),
  Fold.genericLength.fold([1,2,3,4]),
  Fold.sum.fold([1,2,3,4]),
  Fold.concatAll(Sum).lmap(Sum).fold([1,2,3,4]).getSum(),
  Fold.concatAll(Sum).fold(map(Sum)([1,2,3,4])).getSum(),
  Fold.fold(Fold.sum, [1,2,3,4]),
  Fold.fold(sequence(Fold.of, [1,2,3,4,5].map(x => Fold.sum.lmap(y => Math.pow(y, x)))), [1,2,3,4,5,6,7,8,9,10]),
  [...Fold.fold(liftA2(x => y => [x, y])(Fold.min)(Fold.max), range(10000)).map(x => x.fromJust())],
  [...Fold.fold(liftA2(x => y => [x, y])(Fold.sum)(Fold.product), range(100))],
  liftA2(x => y => x / y)
    (Fold((x, y) => concat(x)(Sum(y)), Sum.empty(), x => x.getSum()))
    (Fold((x, y) => concat(Sum(1))(Sum(y)), Sum.empty(), x => x.getSum())).fold(range(10000)),
  liftA2(x => y => x / y)
    (Fold.foldMap(Sum, Sum, x => x.getSum()))
    (Fold.foldMap(Sum, K(Sum(1)), x => x.getSum())).fold([1,2,3,4,5])
)
