const T = require('union-type');

const { map } = require('.');
const { K, I, B } = require('./combinators');
const { Either, Left, Right, either } = require('./either');

const _Stream = T({
  Stream: { runStream: Function /* v => Either v*/ }
});

const { Stream } = _Stream;

Stream.of = v => Stream(sink => {
  B(sink)(Either.try(I))(v);
  return () => {};
});

Stream.interval = time => Stream(sink => {
  let i = 0;
  const id = setInterval(() => sink(Right((i++))), time);

  return () => clearInterval(id);
});

Object.assign(_Stream.prototype, {
  bimap(f, g) {
    return Stream(sink => {
      return this.runStream(B(sink)(either(B(Left)(f))(Either.try(g))));
    });
  },
  map(f) {
    return this.bimap(I, f);
  }
});

const disposable = Stream
  .interval(1000)
  .map(x => {
    if (x % 2 === 0) throw new Error('${x} % 2 === 0');
    return x * 10;
  })
  .runStream(e => {
    e.either(e => console.log(`Error => ${e.message}`), v =>
      console.log(`Value => ${v}`));
  });

setTimeout(() => disposable(), 5000);
