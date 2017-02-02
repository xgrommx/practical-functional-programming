const Type = require('union-type');
const {I, K} = require('../combinators');

const _Sum = Type({
    Sum: [K(true)]
});

const {Sum} = _Sum;

Sum.of = Sum;
Sum.empty = () => Sum(0);

Object.assign(_Sum.prototype, {
    concat(m) {
        return Sum(this.getSum() + m.getSum());
    },
    getSum() {
        return this.case({Sum: I});
    }
});

module.exports = {
  Sum
}
