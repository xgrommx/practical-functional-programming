require('./array');
const Type = require('union-type');
const { liftA2, map, traverse, foldMap } = require('.');
const { B, I } = require('./combinators');

const isIterable = obj =>
  obj != null && typeof obj[Symbol.iterator] === 'function';

const _ZipList = Type({
  ZipList: [isIterable]
});

const { ZipList } = _ZipList;

ZipList.of = value => {
  const repeater = function*(value) {
    for (;;) {
      yield value;
    }
  };

  return ZipList(repeater(value));
};

Object.assign(_ZipList.prototype, {
  map(f) {
    return ZipList.of(f).ap(this);
  },
  ap(other) {
    const _ap = function*(xs, ys) {
      const iterators = [xs, ys].map(_ => _[Symbol.iterator]());

      let [x, y] = iterators.map(_ => _.next());
      while (!x.done && !y.done) {
        yield x.value(y.value);
        [x, y] = iterators.map(_ => _.next());
      }
    };

    return ZipList(_ap(this, other));
  },
  *[Symbol.iterator]() {
    yield* this.case({
      ZipList(xs) {
        return xs;
      }
    });
  },
  foldMap(empty, f) {
    return foldMap(empty, f)(this.getZipList());
  },
  traverse(of, f) {
    return this.getZipList().traverse(of, f).map(ZipList);
  },
  getZipList() {
    return [...this];
  }
});

const zipWith = f =>
  xs => ys => ZipList.of(f).ap(ZipList(xs)).ap(ZipList(ys)).getZipList();
const zipWith3 = f =>
  xs =>
    ys =>
      zs =>
        ZipList
          .of(f)
          .ap(ZipList(xs))
          .ap(ZipList(ys))
          .ap(ZipList(zs))
          .getZipList();

zipWith3(x => y => z => [x, y, z])([1, 2, 3])([4, 5, 6])([7, 8]); //> 1,4,7,2,5,8
console.log(zipWith3(x => y => z => [x, y, z])([1, 2, 3])([4, 5, 6])([7, 8]));

console.log(zipWith(x => y => [x, y])([1, 2, 3])([4, 5, 6]));

console.log(
  liftA2(x => y => x * y)(ZipList.of(10))(ZipList([1, 2, 3])).getZipList()
);

const transpose = xss => traverse(ZipList.of, ZipList)(xss).getZipList();

transpose([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]); //> 1,5,9,2,6,10,3,7,11,4,8,12
foldMap(Array.empty, Array.of)(ZipList([1, 2, 3])); //> 1,2,3
console.log(transpose([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]));

console.log(foldMap(Array.empty, Array.of)(ZipList([1, 2, 3])));

module.exports = {
  ZipList
};
