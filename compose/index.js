const Type = require('union-type');
const { K, I, B } = require('../combinators');
const { liftA2, map, ap, foldMap, traverse } = require('../');

const _Compose = Type({
  Compose: [K(true)]
});

const { Compose } = _Compose;

// Pointed
Compose.of = (T1, T2, x) => Compose(T1.of(T2.of(x)));
// Monoid, Alternative
Compose.empty = T => Compose(T.empty());

Object.assign(_Compose.prototype, {
  // Alternative
  alt(c) {
    return Compose(this.getCompose().alt(c.getCompose()));
  },
  // Functor
  map(f) {
    return Compose(B(map)(map)(f)(this.getCompose()));
  },
  // Applicative
  ap(m) {
    return Compose(liftA2(ap)(this.getCompose())(m.getCompose()));
  },
  // Traversable
  traverse(of, f) {
    return map(x => Compose(x))(
      traverse(of, traverse(of, f))(this.getCompose())
    );
  },
  // Foldable
  foldMap(empty, f) {
    return foldMap(empty, foldMap(empty, f))(this.getCompose());
  },
  getCompose() {
    return this.case({ Compose: I });
  }
});

module.exports = { Compose };

require('../functions');

const take = n => xs => xs.slice(0, n);
const drop = n => xs => xs.slice(n);

const rotate = liftA2(a => b => a.concat(b))(Compose(drop))(
  Compose(take)
).getCompose();

console.log(rotate(3)([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
