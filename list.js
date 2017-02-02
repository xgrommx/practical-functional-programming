'use strict';
const T = require('union-type');

const { K, C, B, I } = require('./combinators');
require('./array');
const { Sum } = require('./sum');
const { Just, Nothing, Maybe } = require('./maybe');
const { chain_, liftA2, map } = require('.');

const foldMap = (empty, f) => xs => {
  if (xs.foldMap) return xs.foldMap(empty, f);
  if (xs.foldr) return xs.foldr(x => acc => f(x).concat(acc), empty());
};

// data List a = Nil | Cons a (List a)
var List = T({ Nil: [], Cons: [K(true), List] });

/*
l = 1 + x * l
l - x * l = 1
l * (1 - x) = 1
l = 1 / (1 - x)
*/
const { Nil, Cons } = List;

List.of = v => Cons(v, Nil());
List.empty = Nil;

Object.assign(Array.prototype, {
  toList() {
    return build(c => n => this.reduceRight((e, a) => c(a)(e), n));
    // if(this.length > 0) {
    //   const [head, ...tail] = this;
    //   return Cons(head, tail.toList())
    // } else {
    //   return Nil()
    // }
  },
});

// build (\c n -> foldr (\x y -> foldr c y x) n xs)
const build = g => g(Cons)(Nil());
// const concat = xss => build(c => n => xss.foldr(x => y => x.foldr(c, y), n))
// const concatAll = xss => xss.foldr(x => y => x.foldr(Cons, y), Nil())
const concatAll = xss => xss.foldr(x => y => x.concat(y), Nil());
// const concat = xss => xss.foldr(n => a => {
//   return n.append(a);
// }, Nil())
Object.assign(List.prototype, {
  // toString() {
  //   return this.case({
  //       Nil: () => 'Nil()',
  //       Cons: (head, tail) => `Cons(${head.toString()}, ${tail.toString()})`
  //   });
  // },
  length() {
    return this.case({
      Nil: K(0),
      Cons(x, xs) {
        return 1 + xs.length();
      },
    });
  },
  at(n) {
    return this.case({
      Cons(x, xs) {
        if (n === 0) return x;
        return xs.at(n - 1);
      },
    });
  },
  head() {
    return this.case({ Cons: (x, _) => x });
  },
  tail() {
    return this.case({ Cons: (_, xs) => xs });
  },
  toString() {
    return this.case({
      Nil: K('Nil'),
      Cons: (head, tail) => `${head.toString()} : ${tail.toString()}`,
    });
  },
  cons(v) {
    return Cons(v, this);
  },
  map(f) {
    return this.case({ Nil, Cons: (head, tail) => Cons(f(head), tail.map(f)) });
  },
  filter(p) {
    return this.case({
      Nil,
      Cons: (head, tail) =>
        p(head) ? Cons(head, tail.filter(p)) : tail.filter(p),
    });
  },
  chain(f) {
    return foldMap(List.empty, f)(this);
    //return concatAll(this.map(v => f(v)))
  },
  ap(m) {
    return this.chain(f => m.map(v => f(v)));
  },
  foldr(f, z) {
    return this.case({ Nil: K(z), Cons: (x, xs) => f(x)(xs.foldr(f, z)) });
  },
  foldl(f, z) {
    return this.case({ Nil: K(z), Cons: (x, xs) => xs.foldl(f, f(z)(x)) });
  },
  concat(ys) {
    return this.case({ Nil: K(ys), Cons: (x, xs) => Cons(x, xs.concat(ys)) });
  },
  toArray() {
    return this.case({
      Nil: K([]),
      Cons: (head, tail) => [head, ...tail.toArray()],
    });
  },
  traverse(of, f) {
    return this.foldr(
      x => ys => liftA2(a => b => Cons(a, b))(f(x))(ys),
      of(Nil())
    );
  },
  isNil() {
    return this.case({ Nil: K(true), Cons: K(false) });
  },
  *[Symbol.iterator]() {
    if (this.isNil()) {
      return;
    } else {
      yield this[0];
      yield* this[1];
    }
  },
});

function* reduce(fn, init, xs) {
  let acc = init;
  for (const x of xs) {
    acc = fn(acc, x);
    // yield acc;
  }
  yield acc;
}

// console.log(
//   ...reduce((acc, x) => acc.concat(x), [], new Map([[10, 20], [30, 40]]))
// )
for (const x of Cons(
  [...Cons(10, Cons(20, Nil()))],
  Cons(
    [...Cons(30, Cons(40, Nil()))],
    Cons([...Cons(50, Cons(60, Nil()))], Nil())
  )
)) {
  console.log(x);
}

// take :: Number -> Iterator a -> Iterator a
function* take(n, xs) {
  for (let x of xs) {
    if (n-- === 0) return;
    yield x;
  }
}

// cycle :: Iterator a -> Iterator a
function* cycle(xs) {
  yield* xs;
  yield* cycle(xs);
}

const compose = l => l.foldr(B, I);

console.log(
  'compose',
  compose(Cons(x => x * 10, Cons(x => x - 20, Nil())))(10)
);

console.log(
  [...take(10, cycle(Cons(10, Cons(20, Cons(30, Nil())))))].toList().toString()
);

const zip = xs => ys => {
  if (xs.length() > 0 && ys.length() > 0) {
    return Cons(
      Cons(xs.head(), Cons(ys.head(), Nil())),
      zip(xs.tail())(ys.tail())
    );
  } else {
    return Nil();
  }
};

console.log(
  zip(Cons(10, Cons(20, Nil())))(Cons(30, Cons(40, Nil())))
    .map(x => x.toArray())
    .toArray()
);

const Y = f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));

// quicksort :: List a -> List a
const quicksort = Y(f => l => {
  return l.case({
    Nil,
    Cons(x, xs) {
      const bigger = f(xs.filter(_ => _ > x));
      const smaller = f(xs.filter(_ => _ <= x));

      //return [...smaller, x, ...bigger]
      return smaller.concat(Cons(x, Nil()).concat(bigger));
    },
  });
  // if(l.length() === 0) {
  //   return Nil()
  // } else {
  //   const x = l.head()
  //   const xs = l.tail()
  //
  //   const bigger = f(xs.filter(_ => _ > x))
  //   const smaller = f(xs.filter(_ => _ <= x))
  //
  //   return smaller.concat(Cons(x, Nil()).concat(bigger))
  // }
});

// var r = (function f(n){
//   if (n <= 0) {
//     return  "foo";
//   }
//   return f(n - 1);
// }(1e6))
//
// "use strict";
// function f(n){
//   if (n <= 0) {
//     return  "foo";
//   }
//   return g(n - 1);
// }
// function g(n){
//   if (n <= 0) {
//     return  "bar";
//   }
//   return f(n - 1);
// }
// return f(1e6) === "foo" && f(1e6+1) === "bar";
console.log(
  [...Cons(1, Cons(2, Cons(3, Nil()))).filter(x => x % 2 === 0)],
  [...quicksort(Cons(200, Cons(3, Cons(1, Nil()))))],
  // r === "foo"
  [...take(10, cycle(quicksort(Cons(200, Cons(3, Cons(1, Nil()))))))].toList()
);
// console.log(
//   C(Cons)(Nil())(10)
// )
// var List2 = T({
//   Nil: [],
//   [':']: [K(true), List2]
// })
//
// Object.assign(List2.prototype, {
//   [':'](x, xs) {
//     return List2[':'](x, xs)
//   }
// })
//
// console.log(
//   List2[':'](10, List2[':'](20, List2.Nil()))
// )
// console.log(
//   //foldMap(Sum.empty, Sum)
//   (Cons(10, Cons(20, Nil())))
//   //.getSum()
//   .chain(x => Cons(x * x, Cons(x * x * x, Nil())))
//   .toArray()
//   // .toList()
//   // .toArray()
//   // Cons(Just(10), Cons(Just(20), Cons(Just(30), Cons(Just(40), Nil()))))
//   // .traverse(Maybe.of, x => x)
//   // .map(x => x.map(_ => _ + 10))
//   // .toString()
//   // Cons(10, Cons(20, Nil()))
//   // .map(x => y => Cons(x, Cons(y, Nil())))
//   // .ap(Cons(30, Cons(40, Nil()))).foldr(n => a => [n.toArray(), ...a] ,[])
//   // Cons(10, Cons(20, Nil())).chain(x => Cons(x * x, Cons(x * x * x, Nil())))
//   // .toString()
//   // concat(Cons(
//   //   Cons(10, Cons(20, Nil())),
//   //   Cons(
//   //     Cons(30, Cons(40, Nil())),
//   //     Cons(
//   //       Cons(50, Cons(60, Nil())),
//   //       Nil())
//   //     )
//   //   )).toString()
//   // Cons(
//   //   Cons(10, Cons(20, Nil())),
//   //   Cons(Cons(30, Cons(40, Nil())), Nil()),
//   // )
//   // [10,20,30,40].map(x => x * 10).toList().cons(100).toString()
//   // Cons(10, Cons(20, Cons(30, Nil()))).map(x => x * 10).toArray()
// )
