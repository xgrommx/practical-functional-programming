const T = require('union-type');
const Rx = require('rx');

const { K, I } = require('./combinators');

const { Sum } = require('./sum');

var Tree = T({
  Empty: [],
  Leaf: [K(true)],
  Node: [Tree, K(true), Tree]
});

const { Empty, Leaf, Node } = Tree;

Object.assign(Tree.prototype, {
  toString() {
    return this.case({
      Empty: () => `Empty`,
      Leaf: v => `(Leaf ${v})`,
      Node: (l, x, r) => `Node ${l.toString()} ${x.toString()} ${r.toString()}`
    });
  },
  // Functor
  map(f) {
    return this.case({
      Empty,
      Leaf: v => Leaf(f(v)),
      Node: (l, x, r) => Node(l.map(f), f(x), r.map(f))
    });
  },
  // Foldable
  foldl(f, z) {
    return this.case({
      Empty: K(z),
      Leaf: a => f(z)(a),
      Node: (l, x, r) => r.foldl(f, f(l.foldl(f, z))(x))
    });
  },
  // Foldable
  foldr(f, z) {
    return this.case({
      Empty: K(z),
      Leaf: a => f(a)(z),
      Node: (l, x, r) => l.foldr(f, f(x)(r.foldr(f, z)))
    });
  },
  // Foldable
  foldMap(empty, f) {
    return this.case({
      Empty: empty,
      Leaf: a => f(a),
      Node: (l, x, r) =>
        l.foldMap(empty, f).concat(f(x)).concat(r.foldMap(empty, f))
    });
  },
  // Traversable
  traverse(of, f) {
    return this.case({
      Empty: () => of(Empty()),
      Leaf: a => f(a).map(x => Leaf(x)),
      Node: (l, x, r) =>
        l
          .traverse(of, f)
          .map(l => x => r => Node(l, x, r))
          .ap(f(x))
          .ap(r.traverse(of, f))
    });
  }
});

const cons = x => xs => [x, ...xs];
const { Observable } = Rx;

Observable.prototype.ap = function(o) {
  return this.combineLatest(o, (f, v) => f(v));
};

const _ZipObservable = T({
  ZipObservable: [K(true)]
});

const { ZipObservable } = _ZipObservable;

ZipObservable.of = value => {
  return ZipObservable(Observable.interval(0).map(_ => value));
};

Object.assign(_ZipObservable.prototype, {
  map(f) {
    return ZipObservable.of(f).ap(this);
  },
  ap(other) {
    return ZipObservable(
      Observable.zip(this.getZipObservable(), other.getZipObservable(), (
        f,
        v
      ) =>
        f(v))
    );
  },
  getZipObservable() {
    return this.case({
      ZipObservable(xs) {
        return xs;
      }
    });
  }
});

// const zipWith3 = f => xs => ys => zs => ZipObservable.of(f).ap(ZipObservable(xs)).ap(ZipObservable(ys)).ap(ZipObservable(zs)).getZipObservable();
//
// zipWith3(x => y => z => [x, y ,z])
//   (Observable.of(1,2,3))
//   (Observable.of(4,5,6))
//   (Observable.of(7,8)).subscribe(x => console.log(x))

require('./array');
const { ZipList } = require('./zip-list.js');

var _Max = T({
  Max: [Number]
});

const { Max } = _Max;

Max.empty = () => Max(-Infinity);

Object.assign(_Max.prototype, {
  getMax() {
    return this.case({
      Max: I
    });
  },
  concat(m) {
    return Max(Math.max(this.getMax(), m.getMax()));
  }
});

// data Stream = Stream { runStream :: Function }

const _Stream = T({
  Stream: { runStream: Function }
});

const { Stream } = _Stream;

Object.assign(_Stream.prototype, {
  map(f) {
    return Stream(o => this.runStream(x => o(f(x))));
  }
  // runStream(fn) {
  //   return this.case({
  //     Stream(subscribe) {
  //       return subscribe(fn)
  //     }
  //   })
  // },,,,,,,,,,
});

Stream(fn => {
  fn(10);
})
  .map(x => x * 10)
  .runStream(x => console.log(x));
// Node(
//   Leaf([1]),
//   [10,20,30,40],
//   Leaf([100,200,300])
// ).traverse(Array.of, x => x)
//  .map(x => x.foldMap(Max.empty, Max))
//  .forEach(x => console.log(x.getMax()))
// Node(
//   Leaf(Observable.interval(2500).scan((a, b) => a + b, 0)),
//   Observable.interval(500).scan((a, b) => a + b, 0),
//   Leaf(Observable.interval(1000).scan((a, b) => a + b, 0))
// ).traverse(ZipObservable.of, o => ZipObservable(o)) // Tree (Observable a) => Observable (Tree a)
// // .map(x => x.foldMap(Sum.empty, Sum).getSum()) // Tree => Number
// // .scan((a, b) => a + b.foldMap(Sum.empty, Sum).getSum(), 0)
// .getZipObservable()
// .subscribe(x => console.log(x.toString()))
// Node(
//   Leaf(Observable.of(10)),
//   Observable.of(20),
//   Leaf(Observable.of(30))
// ).foldr(n => a => n.concat(a), Observable.empty()).subscribe(x => console.log(x))
