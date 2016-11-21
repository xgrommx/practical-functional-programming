// K :: a -> b -> a
const K = x => y => x;
// S :: (a -> b -> c) -> (a -> b) -> a -> c
const S = x => y => z => x(z)(y(z));
// I :: a -> a
const I = S(K)(K);
// B :: (b -> c) -> (a -> b) -> a -> c
const B = S(K(S))(K);
// C :: (a -> b -> c) -> b -> a -> c
const C = S(B(B)(S))(K(K));
// W :: (a -> a -> b) -> a -> b
const W = S(S)(S(K));
// W__ :: (a -> b -> c -> c -> d) -> a -> b -> c -> d
const W__ = B(B(W));
// Q :: (a -> b) -> (b -> c) -> a -> c
const Q = C(B);

module.exports = {
    S, K, I, B, C, W, W__, Q
};