const T = require('union-type');
const R = require('ramda');

const { Observable } = require('rx/dist/rx.all');

require('./array');

const { K } = require('./combinators');

const { Sum } = require('./sum');
const { foldMap, map, liftA2 } = require('.');

// const {ZipList} = require('./zip-list');

Object.assign(Observable.prototype, {
  // Applicative
  ap(m) {
    return this.combineLatest(m, (f, v) => f(v));
  },
});

Array.prototype.toString = function() {
  return `[${this.join(',')}]`;
};

// data Tree a = Node { root :: a, children :: [Tree a] }
var Tree = T({
  Node: {
    root: R.T,
    children: xs => xs.every(x => Tree.prototype.isPrototypeOf(x))
    // subForest: x => x.length === 0 || T.ListOf(Tree)(x) // check it for Forest = [Tree],
  },
});

const { Node } = Tree;

// Pointed Functor
Tree.of = x => Node(x, []);

Object.assign(Tree.prototype, {
  toString() {
    return this.case({
      Node(x, xs) {
        return `Node(${x.toString()}, ${xs.toString()})`;
      },
    });
  },
  // Monoid?
  concat(t) {
    return this.case({
      Node(x, xs) {
        return t.case({
          Node(x1, xs1) {
            return Node(x.concat(x1), R.zipWith(R.concat, xs, xs1));
          },
        });
      },
    });
  },
  // Setoid?
  equals(t) {
    return this.case({
      Node(x, xs) {
        return t.case({
          Node(x1, xs1) {
            return x === x1 &&
              xs.length === xs1.length &&
              R.all(Boolean)(R.zipWith((x, y) => x.equals(y), xs, xs1));
          },
        });
      },
    });
  },
  // Functor
  map(f) {
    return this.case({
      Node(x, xs) {
        return Node(f(x), xs.map(map(f)));
      },
    });
  },
  // Applicative
  ap(m) {
    return this.case({
      Node(f, fs) {
        return m.case({
          Node(x, xs) {
            return Node(x, xs.map(map(f)).concat(fs.map(s => s.ap(m))));
          },
        });
        // return Node(
        //   f(m.rootLabel),
        //   m.subForest.map(map(f)).concat(fs.map(s => s.ap(m)))
        // )
      },
    });
  },
  // Traversable
  traverse(of, f) {
    return this.case({
      Node(x, xs) {
        return f(x)
          .map(r => s => Node(r, s))
          .ap(xs.traverse(of, t => t.traverse(of, f)));
      },
    });
  },
  // foldMap(empty, f) {
  //   return this.case({
  //     Node(x, xs) {
  //       return f(x).concat(foldMap(empty, foldMap(empty, f))(xs))
  //     }
  //   })
  // },
  // Foldable
  foldl(f, z) {
    return this.case({
      Node(x, xs) {
        // f(l.foldl(f, z))(x)
        return xs.foldl((a, b) => b.foldl(f, a), f(z, x));
        // return f(xs.foldl((a, b) => b.foldl(f, a), z), x)
      },
    });
  },
  // Foldable
  foldr(f, z) {
    return this.case({
      // l.foldr(f, f(x)(r.foldr(f, z)))
      Node(x, xs) {
        // return xs.foldr((a, b) => a.foldr(f, b), f(x, z))
        return f(x, xs.foldr((a, b) => a.foldr(f, b), z));
      }
      // Node: (x, xs) => xs.foldr((a, b) => a.foldr(f, b), f(x, z)),
    });
  },
  // Monad
  chain(f) {
    return this.case({
      Node(x, xs) {
        // const [_x, _xs] = f(x)
        const { root, children } = f(x);

        // return Node(_x, _xs.concat(xs.map(v => v.chain(f))))
        return Node(root, children.concat(xs.map(v => v.chain(f))));
      },
    });
  },
  // Iterator
  *[Symbol.iterator]() {
    yield this.root;
    for (let c of this.children) {
      yield* c;
    }
  },
});

console.log(
  Node(10, []).map(x => x * 10),
  Node(10, [Node(20, []), Node(30, [])]).equals(
    Node(10, [Node(20, []), Node(30, [])]),
  ),
  Node([10], [Node([20], [Node([30], [])])])
    .concat(Node([100], [Node([200], [Node([300], [])]), Node([400], [])]))
    .toString(),
);

const depthFirst = t => t.case({
  Node(x, xs) {
    return [].concat(x, ...xs.map(_ => depthFirst(_)));
  },
});

console.log(depthFirst(Node(10, [Node(20, []), Node(30, [])])));

console.log(
  R.sequence(R.of, R.repeat([-1, 0, 1], 2))
  // foldMap(Sum.empty, Sum)
  // [...Node(10, [])
  //   .chain(x => Node(x, [Node(x * x, []), Node(x * x * x, [])]))]
  // .getSum()
  // .foldr((a, b) => [a].concat(b), [])
  // .foldl((a, b) => a.concat([b]), [])
  // foldMap(Sum.empty, Sum)(Node(10, [
  //   Node(20, []),
  //   Node(30, [])
  // ])).getSum()
  //.foldl((a, b) => a - b, 0)
  // .foldMap(Sum.empty, Sum).getSum(),
);
// Node(Observable.interval(500), [
//   Node(Observable.interval(1000), []),
//   Node(Observable.interval(1500), [])
// ]).traverse(Observable.of, x => x).subscribe(x => console.log(x.toString()))
// console.log(
//   Node(Observable.of([10, 20]), [
//     Node(Observable.of([30, 40]), []),
//     Node(Observable.of([50, 60]), [])
//   ]).traverse(Observable.of, x => x)
// )
// console.log(
//   Node(x => x * 10, [Node(x => x * 20, []), Node(x => x * 30, [])])
//   .ap(Node(10, [Node(20, []), Node(30, [])]))
//   .map(x => x * 10)
// )
