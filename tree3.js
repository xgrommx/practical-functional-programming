const T = require('union-type');
const { K } = require('./combinators');

var Tree = T({
  Empty: [],
  Node: [K(true), Tree, Tree]
});

const { Empty, Node } = Tree;

Object.assign(Tree.prototype, {
  drawTree() {
    const draw = t => t.case({
      Empty: K(['--(null)']),
      Node(v, l, r) {
        const [r_, ...rs] = draw(r);
        const ls = draw(l);

        const v_ = `--${v}`;
        const ls_ = ls.map(x => `  |${x}`);
        const rs_ = ['  `' + r_, ...rs.map(x => `   ${x}`)];

        return [v_, ...ls_, ...rs_];
      }
    });

    return draw(this).join('\n');
  }
});

const insert = (t, x) => {
  return t.case({
    Empty() {
      return Node(x, Empty(), Empty());
    },
    Node(y, l, r) {
      if (x < y) return Node(y, insert(l, x), r);
      else if (y < x) return Node(y, l, insert(r, x));
      else return t;
    }
  });
};

const buildTree_ = t => {
  if (t.length === 0) {
    return Empty();
  } else {
    const [x, ...xs] = t;
    return insert(buildTree_(xs), x);
  }
};

const buildTreeFromSortedList = l => {
  if (l.length === 0) return Empty();

  const n = Math.floor(l.length / 2);
  const lt = l.slice(0, n);
  const [x, ...rt] = l.slice(-(n + 1));

  return Node(x, buildTreeFromSortedList(lt), buildTreeFromSortedList(rt));
};

console.log(
  buildTreeFromSortedList([1, 2, 3, 4, 5, 6]).drawTree()
  // [1,2,3,4,5,6].reduceRight(insert, Empty()).drawTree()
);
