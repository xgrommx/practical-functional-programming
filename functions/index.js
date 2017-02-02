const { S, B, K, W__, Q } = require('../combinators');
const { liftA2, concat } = require('../');

const T = require('union-type');

const _Fn = T({
  Fn: [Function]
});

const { Fn } = _Fn;

Fn.of = B(Fn)(K);
Fn.empty = T => K(T.empty());

Object.assign(_Fn.prototype, {
  runFn(x) {
    return this.case({
      Fn(fn) {
        return fn(x);
      }
    });
  },
  map(f) {
    return Fn(x => f(this.runFn(x)));
  },
  chain(f) {
    return Fn(x => f(this.runFn(x)).runFn(x));
  }
});

console.log(
  'test',
  Fn(x => x * 10)
    .map(x => x * 20)
    .map(x => x * 40)
    .chain(x => Fn(y => x * y))
    .runFn(10)
);

// Pointed
Function.of = K;
// Monoid
Function.empty = T => K(T.empty());

Object.assign(Function.prototype, {
  // Functor
  map(f) {
    return B(f)(this);
  },
  // Applicative
  ap(m) {
    return S(this)(m);
  },
  // Monad
  chain(f) {
    return W__(Q)(this)(f);
  },
  // Monoid
  concat(m) {
    return liftA2(concat)(this)(m);
  }
});

console.log((x => x * 10).map(x => x - 20)(10));
console.log(B(x => x - 20)(x => x * 10)(10));

const take = n => xs => xs.slice(0, n);
const drop = n => xs => xs.slice(n);

const rotate = concat(drop)(take);

Number.prototype[Symbol.iterator] = function*() {
  for (let i = 0; i < this; i++) {
    yield i;
  }
};

for (let i of 10) {
  console.log(i);
}

console.log(
  rotate(3)([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  [...10],
  Array.from(10)
);
