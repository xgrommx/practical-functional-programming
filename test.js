require('./array');
require('./functions');

const { K, B, I } = require('./combinators');
const { Maybe, Just, Nothing } = require('./maybe');
const { Either, Left, Right } = require('./either');
const { Compose } = require('./compose');

const { foldMap, replicateM, mapLeft, mapRight, traverse, liftA2 } = require(
  '.'
);

console.log(
  // foldMap(Array, Array.of)(Compose([Just(10), Just(20), Nothing()])),
  // replicateM(Array, 2)([1, 2, 3]),
  mapRight([1, 2, 3])([4]),
  mapLeft([1, 2, 3])([4])
);

const Type = require('union-type');

const _Identity = Type({
  Identity: [K(true)]
});

const { Identity } = _Identity;

Identity.of = Identity;

Object.assign(_Identity.prototype, {
  getIdentity() {
    return this.case({ Identity: I });
  },
  map(f) {
    return Identity(f(this.getIdentity()));
  },
  ap(m) {
    return Identity(this.getIdentity()(m.getIdentity()));
  },
  foldMap(f) {
    return f(this.getIdentity());
  },
  traverse(f) {
    return f(this.getIdentity()).map(x => Identity(x));
  },
  chain(f) {
    return f(this.runIdentity());
  }
});

const _Const = Type({
  Const: [K(true)]
});

const { Const } = _Const;

Const.of = Const;

Object.assign(_Const.prototype, {
  getConst() {
    return this.case({ Const: (a, b) => a });
  },
  map() {
    return this;
  },
  ap(m) {
    return Const(this.getConst().concat(m.getConst()));
  }
});

const foldMapDefault = (T, f) =>
  xs => traverse(K(Const.of(T.empty())), B(Const)(f))(xs).getConst();

console.log(
  foldMapDefault(Array, Array.of)(Compose([Just(10), Just(20), Nothing()]))
);

const fmapDefault = (T, f) =>
  xs => traverse(K(Identity.of(T.empty())), B(Identity)(f))(xs).getIdentity();

console.log(
  B(foldMapDefault(Array, Array.of))(fmapDefault(Maybe, x => x * 10))(
    Compose([Just(10), Just(20), Nothing()])
  )
);

// class Tuple {
//   constructor(a, b) {
//     this.a = a;
//     this.b = b;
//   }
//
//   get fst() {
//     return this.a;
//   }
//
//   get snd() {
//     return this.b
//   }
//
//   get() {
//     return [this.a, this.b];
//   }
// }
//
// const [a, b] = new Tuple(10, 20).get();
//
// console.log(a, b);

const _Tuple = Type({
  Tuple: { _1: K(true), _2: K(true) }
});

const { Tuple } = _Tuple;

Tuple.of = (empty, x) => Tuple(empty(), x);
Tuple.empty = (empty1, empty2) => Tuple(empty1(), empty2());

Object.assign(_Tuple.prototype, {
  map(f) {
    return Tuple(this.fst(), f(this.snd()));
  },
  ap(m) {
    const [u, f] = this;
    const [v, x] = m;

    return Tuple(u.concat(v), f(x));
  },
  chain(f) {
    const [u, a] = this;
    const [v, b] = f(a);

    return Tuple(u.concat(v), b);
  },
  concat(m) {
    const [a1, b1] = this;
    const [a2, b2] = m;

    return Tuple(a1.concat(a2), b1.concat(b2));
  },
  fst() {
    return this.case({
      Tuple(x, y) {
        return x;
      }
    });
  },
  snd() {
    return this.case({
      Tuple(x, y) {
        return y;
      }
    });
  },
  foldMap(empty, f) {
    return f(this.snd());
  },
  foldr(f, z) {
    return f(this.snd(), y);
  },
  traverse(of, f) {
    return f(this.snd()).map(_ => Tuple(this.fst(), _));
  },
  valueOf() {
    return [this.fst(), this.snd()];
  }
});

// const [x, y] = Tuple("10", 20).chain(x => Tuple(" Hello", x * 20));
const [x, y] = Tuple([10, 20], [30, 40]).traverse(Array.of, I);
console.log([x, y]);

// const _Writer = Type({
//   Writer: {runWriter: Function}
// });
//
// const {Writer} = _Writer;
//
// const writer = tuple => Writer(K(tuple));
//
// Writer.of = (x, empty) => writer(Tuple(x, empty()));
//
//
// Object.assign(_Writer.prototype, {
//   map(f) {
//     const [a, w] = this.runWriter();
//
//     return writer(Tuple(f(a), w));
//   },
//   chain(f) {
//     const [a, w] = this.runWriter();
//     const [a_, w_] = f(a).runWriter();
//
//     return writer(Tuple(a_, w.concat(w_)));
//   }
// });
//
// console.log([...Writer.of(10, () => "").chain(x => writer(Tuple(x + 20, `+${20}`))).runWriter()])

const isTuple = obj => {
  return obj.case({
    Tuple: K(true)
  });
};

const _Writer = Type({
  Writer: [isTuple]
});

const { Writer } = _Writer;

Writer.of = (x, empty) => Writer(Tuple(x, empty()));

Object.assign(_Writer.prototype, {
  runWriter() {
    return this.case({ Writer: I });
  },
  execWriter() {
    return this.runWriter().snd();
  },
  evalWriter() {
    return this.runWriter().fst();
  },
  map(f) {
    const [a, w] = this.runWriter();
    return Writer(Tuple(f(a), w));
  },
  chain(f) {
    const [a, w] = this.runWriter();
    const [a_, w_] = f(a).runWriter();

    return Writer(Tuple(a_, w.concat(w_)));
  }
});

console.log(Writer(Tuple(10, 20)).runWriter()._1);

console.log([Just(10), Nothing()].chain(m => m.maybe([], Array.of)));
// console.log(Writer.of(10, () => "")
//   .chain(x => Writer(Tuple(x + 20, `${x} + ${20} = ${x+20} => `)))
//   .chain(x => Writer(Tuple(x + 30, `${x} + ${30} = ${x+30}`)))
//   .execWriter())
// const [x, y] = Tuple(10, 20).map(x => x * 10);
// console.log([x, y])
// foldMap(Array,)
