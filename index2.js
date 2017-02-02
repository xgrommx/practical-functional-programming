const request = require('request');
const Task = require('data.task');
const Either = require('data.either');
const { List } = require('immutable-ext');

const Sum = x => ({
  x,
  concat: ({ x: y }) => Sum(x + y),
  inspect: () => `Sum(${x})`
});

Sum.empty = () => Sum(0);

const Pair = (x, y) => ({
  x,
  y,
  bimap: (f, g) => Pair(f(x), g(y)),
  toList: () => [x, y],
  concat: ({ x: x1, y: y1 }) => Pair(x.concat(x1), y.concat(y1)),
  inspect: () => `Pair(${x}, ${y})`
});

const httpGet = url =>
  new Task((rej, res) =>
    request(url, (error, response, body) => error ? rej(error) : res(body)));

const getJSON = url => httpGet(url).map(parse).chain(eitherToTask);

const first = xs => Either.fromNullable(xs[0]);

const eitherToTask = e => e.fold(Task.rejected, Task.of);

const parse = Either.try(JSON.parse);

const findArtist = name =>
  getJSON(`https://api.spotify.com/v1/search?q=${name}&type=artist`)
    .map(result => result.artists.items)
    .map(first)
    .chain(eitherToTask);

const relatedArtists = id =>
  getJSON(`https://api.spotify.com/v1/artists/${id}/related-artists`).map(
    result => result.artists
  );

const Intersection = xs => ({
  xs,
  concat: ({ xs: ys }) => Intersection(xs.filter(x => ys.some(y => x === y)))
});

const related = name => findArtist(name)
  .map(artist => artist.id)
  .chain(relatedArtists)
  .map(artists => artists.map(artist => artist.name));

const artistIntersection = rels => rels
  .foldMap(x => Pair(Intersection(x), Sum(x.length)))
  .bimap(x => x.xs, y => y.x)
  .toList();

const main = names =>
  List(names).traverse(Task.of, related).map(artistIntersection);

Task
  .of(['oasis', 'blur', 'radiohead'])
  .chain(main)
  .fork(console.error, console.log);
