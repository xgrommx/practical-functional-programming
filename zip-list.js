const Type = require('union-type');
const {liftA2} = require('.');

const isIterable = obj => obj != null && typeof obj[Symbol.iterator] === 'function';

const _ZipList = Type({
    ZipList: [isIterable]
});

const {ZipList} = _ZipList;

ZipList.of = value => {
    const repeater = function * (value) {
        for(;;) { yield value }
    };

    return ZipList(repeater(value));
};

Object.assign(_ZipList.prototype, {
    map(f) {
        return ZipList.of(f).ap(this)
    },
    ap(other) {
        const _ap = function * (xs, ys) {
            const iterators = [xs, ys].map(_ => _[Symbol.iterator]());

            let [x, y] = iterators.map(_ => _.next());
            while(!x.done && !y.done) {
                yield x.value(y.value);
                [x, y] = iterators.map(_ => _.next());
            }
        };

        return ZipList(_ap(this, other))
    },
    * [Symbol.iterator] () {
        yield * this.case({
            ZipList(xs) {
                return xs;
            }
        })
    },
    getZipList() {
        return [...this];
    }
});

const zipWith = f => xs => ys => ZipList.of(f).ap(ZipList(xs)).ap(ZipList(ys)).getZipList();

console.log(
  zipWith(x => y => [x, y])([1,2,3])([4,5,6])
);

console.log(
  liftA2(x => y => x * y)(ZipList.of(10))(ZipList([1,2,3])).getZipList()
);
