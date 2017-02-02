const Type = require('union-type');
const { K, B, I } = require('../combinators');
const { map, chain_ } = require('../');

const Either = Type({
  Left: [K(true)],
  Right: [K(true)]
});

const { Left, Right } = Either;

Either.of = Right;

Either.try = f => (...args) => {
  try {
    return Right(f(...args));
  } catch (e) {
    return Left(e);
  }
};

Object.assign(Either.prototype, {
  // Functor
  map(f) {
    return chain_(B(Right)(f))(this);
  },
  // Bifunctor
  bimap(f, g) {
    return this.either(B(Left)(f), B(Right)(g));
  },
  // Monad
  chain(f) {
    return this.either(Left, f);
  },
  // Applicative
  ap(m) {
    return chain_(f => map(v => f(v))(m))(this);
  },
  // Foldable
  foldr(f, z) {
    return this.either(K(z), y => f(y, z));
  },
  // Foldable
  foldl(f, z) {
    return this.either(K(z), y => f(z, y));
  },
  // Foldable
  foldMap(empty, f) {
    return this.either(K(empty()), f);
  },
  // Traversable
  traverse(of, f) {
    return this.either(x => of(Left(x)), B(map(Right))(f));
  },
  fromLeft() {
    return this.case({ Left: I });
  },
  fromRight() {
    return this.case({ Right: I });
  },
  isLeft() {
    return this.either(K(true), K(false));
  },
  isRight() {
    return !this.isLeft();
  },
  either(f, g) {
    return this.case({
      Left: _ => f(_),
      Right: _ => g(_)
    });
  }
});

Either.try(x => {
  if (x === 2) {
    throw new Error('This is 2');
  } else {
    return x * x;
  }
})(2).either(x => console.log(`Error => ${x.message}`), x => console.log(x));

module.exports = { Either, Left, Right };
