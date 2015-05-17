import qs from 'querystring';

function getNode(id) {
  return `${id} [label=${id}];`;
}

function getEdge(from, to) {
  return `${from} -> ${to};`;
}

function getEdges(node, edges) {
  return Object.keys(edges).map(to => getEdge(to, node)).join('\n');
}

export function toDot(poset) {
  var dot = 'digraph poset {\n';
  dot += Object.keys(poset.nodes).map(getNode).join('\n');
  dot += '\n';
  dot += Object.keys(poset.nodes).map(node => getEdges(node, poset.nodes[node])).join('');
  dot += '\n}';
  return dot;
}

const GOOGLE_API = 'https://chart.googleapis.com/chart?';

// see https://developers.google.com/chart/image/docs/gallery/graphviz?csw=1
export function toSrc(poset, options = {}) {
  const dot = toDot(poset);
  const { engine = 'dot' } = options;
  const ret = GOOGLE_API + qs.stringify({
    cht: `gv:${engine}`,
    chl: dot
  });
  return ret;
}