require('../array');
const {Maybe, Just, Nothing} = require('../maybe');
const Type = require('union-type');
const {I, K, B} = require('../combinators');
const {zipWith, tail, zip} = require('ramda');
const {foldMap} = require('..');

// Functor
// Applicative
// Monad
// Monoid
// Foldable
// Traversable
// Alternative
// MonadPlus

// Monoids

// Any => Monoid !
// All => Monoid !
// Array ?
// Maybe => Monoid, Monad, Applicative, Functor, Foldable, Traversable, Alternative
// IO => Monoid, Monad, Functor, Applicative
// Last => Monoid
// First => Monoid
// Product => Monoid, Functor, Monad, Applicative
// Sum => Monoid, Functor, Monad, Applicative
// Endo => Monoid
// Identity
// Function
// Tuple
// Const

const _Last = Type({
  Last: [K(true)]
});

const {Last} = _Last;

Last.of = Last;
Last.empty = () => Last(Nothing());

Object.assign(_Last.prototype, {
  map(f) {
    return Last(this.getLast().map(f));
  },
  ap(m) {
    return Last(this.getLast().ap(m.getLast()));
  },
  chain(f) {
    return Last(this.getLast().chain(f));
  },
  foldMap(empty, f) {
    return foldMap(empty, f)(this.getLast());
  },
  traverse(of, f) {
    return this.getLast().traverse(of, f).map(Last);
  },
  concat(m) {
    return m.getLast().maybe(this, K(m));
  },
  getLast() {
    return this.case({Last: I});
  }
});

console.log(
  Last(Just(10)).concat(Last(Just(20))),
  Last(Just(10)).concat(Last(Nothing())),
  Last(Nothing()).concat(Last(Just(20))),
  Last(Nothing()).concat(Last(Nothing()))
);

const _First = Type({
  First: [K(true)]
});

const {First} = _First;

First.of = First;
First.empty = () => First(Nothing());

Object.assign(_First.prototype, {
  map(f) {
    return First(this.getFirst().map(f));
  },
  ap(m) {
    return First(this.getFirst().ap(m.getFirst()));
  },
  chain(f) {
    return First(this.getFirst().chain(f));
  },
  foldMap(empty, f) {
    return foldMap(empty, f)(this.getFirst());
  },
  traverse(of, f) {
    return this.getFirst().traverse(of, f).map(First);
  },
  concat(m) {
    return this.getFirst().maybe(m, K(this));
  },
  getFirst() {
    return this.case({First: I});
  }
});

const findLast = p => xs => foldMap(Last.empty, x => {
  return Last((p(x) ? Just(x) : Nothing()))
})(xs).getLast();

console.log(
  findLast(x => x < 5)([1,3,4,5,6]),
  foldMap(Array.empty, Array.of)(First(Just(10)))
);

const find = p => xs => foldMap(First.empty, x => {
  return First((p(x) ? Just(x) : Nothing()))
})(xs).getFirst();

console.log(
  find(x => x < 5)([1,3,4,5,6]),
  foldMap(Array.empty, Array.of)(First(Just(10)))
);

const _Product = Type({
  Product: [Number]
});

const {Product} = _Product;

Product.of = Product;
Product.empty = () => Product(1);

Object.assign(_Product.prototype, {
    // map, chain, foldMap, traverse, ap
    concat(m) {
        return Product(this.getProduct() + m.getProduct());
    },
    getProduct() {
        return this.case({Product: I});
    }
});

const _Any = Type({
  Any: [Boolean]
});

const {Any} = _Any;

Any.of = Any;
Any.empty = () => Any(false);

Object.assign(_Any.prototype, {
  concat(m) {
      return Any(this.getAny() || m.getAny());
  },
  getAny() {
      return this.case({Any: I});
  }
});

const or = xs => foldMap(Any.empty, Any)(xs).getAny();
const any = p => xs => foldMap(Any.empty, B(Any)(p))(xs).getAny();

const _All = Type({
    All: [Boolean]
});

const {All} = _All;

All.of = All;
All.empty = () => All(true);

Object.assign(_All.prototype, {
    concat(m) {
        return All(this.getAll() && m.getAll());
    },
    getAll() {
        return this.case({All: I});
    }
});

const and = xs => foldMap(All.empty, All)(xs).getAll();
const all = p => xs => foldMap (All.empty, B(All)(p))(xs).getAll();

const compare = (a, b) => a <= b;
const isSorted = xs => B(and)(xs => zipWith(compare, xs, tail(xs)))(xs);
const isSorted_ = xs => all(([a, b]) => compare(a, b))(zip(xs, tail(xs)))

console.log(
  isSorted([4,5,6,7]),
  isSorted_([4,5,6,7])
);

// const isSorted = xs => all(Boolean, zipWith(compare)(xs)(tail(xs)))
