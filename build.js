const cons = a => b => [a, ...b];
const build = g => g(cons)([]);
const foldr = f => n => xs => xs.reduceRight((acc, next) => f(next)(acc), n);
const compose = f => g => x => f(g(x));

Function.prototype.map = function(f) {
  return compose(f)(this);
};

const map = f => xs => build(c => n => foldr(f.map(c))(n)(xs));

// const map = f => xs => build(c => n => xs.reduceRight((acc, next) => c(f(next))(acc), n));

console.log(map(x => x * 10)([10,20,30]));

const concatMap = f => xs => build(c => n => foldr(f.map(foldr(c)))(n)(xs))

// const concatMap = f => xs => build(c => n => xs.reduceRight((b, x) => f(x).reduceRight((a, y) => c(y)(a) ,b) ,n));

console.log(concatMap(x => [x, x*x, x*x*x])([10,20,30]));
