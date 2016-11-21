require('./array');
require('./functions');

const {Maybe, Just, Nothing} = require('./maybe');
const {Either, Left, Right} = require('./either');
const {Compose} = require('./compose');

const {foldMap, replicateM} = require('.');

console.log(
    foldMap(Array, Array.of)(Compose([Just(10), Just(20), Nothing()])),
    replicateM(Array, 2)([1, 2, 3])
);