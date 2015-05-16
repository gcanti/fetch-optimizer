import debug from 'debug';

const log = debug('fetch-optimizer');

export function optimize(poset, nodes) {
  const chain = poset.getSubPoset(nodes).toChain();
  const init = Promise.resolve(null);
  return chain.reduce((promise, rank) => {
    const names = Object.keys(rank);
    return promise.then(res => {
      log('the following tasks will run in parallel: %j with input: %j', names, res);
      const promises = names.map(name => {
        const promise = nodes[name](res);
        return promise.then(res => {
          log('task `%s` returns: %j', name, res);
          return res;
        });
      });
      return Promise.all(promises);
    });
  }, init);
}

function isEmpty(hash) {
  for (let k in hash) {
    return false;
  }
  return true;
}

function merge(a, b) {
  for (let k in b) {
    a[k] = b[k];
  }
  return a;
}

export class Poset {

  constructor(nodes = {}) {
    this.nodes = nodes;
  }

  isEmpty() {
    return isEmpty(this.nodes);
  }

  addNode(node) {
    this.nodes[node] = this.nodes[node] || {};
    return this;
  }

  addEdge(from, to) {
    this.addNode(from).addNode(to);
    this.nodes[from][to] = 1;
    return this;
  }

  getEdges(node) {
    return this.nodes[node];
  }

  hasEdges(node) {
    return !isEmpty(this.getEdges(node));
  }

  getMaximalElements() {
    const ret = {};
    for (let node in this.nodes) {
      if (!this.hasEdges(node)) {
        ret[node] = 1;
      }
    }
    return ret;
  };

  toChain() {
    let poset = this;
    const ret = [];
    while (!poset.isEmpty()) {
      let roots = poset.getMaximalElements();
      ret.push(roots);
      let nodes = {};
      for (let node in poset.nodes) {
        if (!roots.hasOwnProperty(node)) {
          nodes[node] = {};
          let edges = poset.getEdges(node);
          for (let to in edges) {
            if (!roots.hasOwnProperty(to)) {
              nodes[node][to] = edges[to] || 1;
            }
          }
        }
      }
      poset = new Poset(nodes);
    }
    return ret;
  }

  getSubPoset(nodes) {
    const ret = {};
    var getEdges = node => {
      const ret = {};
      const edges = this.getEdges(node);
      for (let to in edges) {
        if (nodes.hasOwnProperty(to)) {
          ret[to] = edges[to];
        } else {
          merge(ret, getEdges(to));
        }
      }
      return ret;
    };
    for (let node in nodes) {
      ret[node] = getEdges(node);
    }
    return new Poset(ret);
  }

}
