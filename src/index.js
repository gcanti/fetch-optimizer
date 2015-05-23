import debug from 'debug';

const SOURCE = 'fetch-optimizer';
const log = debug(SOURCE);

export const options = {
  Promise: Promise
};

export function optimize(dependencies: Poset, fetchers: Object, initPromise) {
  const upset = dependencies.getUpsetPoset(fetchers);
  if (process.env.NODE_ENV !== 'production') {
    for (let fetcher in upset.nodes) {
      if (!fetchers.hasOwnProperty(fetcher)) {
        throw new Error(`${SOURCE} cannot optimize: fetcher "${fetcher}" is missing`);
      }
    }
  }
  const chain = upset.toChain();
  initPromise = initPromise || options.Promise.resolve(null);
  return chain.reduce((promise, rank) => {
    const names = Object.keys(rank);
    return promise.then(res => {
      log('parallel fetchers: %j with input: %j', names, res);
      const promises = names.map(name => {
        const promise = fetchers[name](res);
        return promise.then(res => {
          //log('fetcher `%s` returns: %j', name, res);
          return res;
        });
      });
      return options.Promise.all(promises);
    });
  }, initPromise);
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

  addNodes(...nodes) {
    nodes.forEach(node => this.addNode(node));
    return this;
  }

  addEdge(from, to) {
    this.addNode(from).addNode(to);
    this.nodes[from][to] = 1;
    return this;
  }

  getEdges(node) {
    if (this.nodes.hasOwnProperty(node)) {
      return this.nodes[node];
    } else if (process.env.NODE_ENV !== 'production') {
      throw new Error(`${SOURCE} unknown node ${node}`);
    }
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

  getUpsetPoset(nodes) {
    const ret = {};
    const addNodes = nodes => {
      for (let node in nodes) {
        if (this.nodes.hasOwnProperty(node)) {
          if (!ret.hasOwnProperty(node)) {
            const edges = this.getEdges(node);
            ret[node] = edges;
            addNodes(edges);
          }
        } else if (process.env.NODE_ENV !== 'production') {
          throw new Error(`${SOURCE} unknown node ${node}`);
        }
      }
    };
    addNodes(nodes);
    return new Poset(ret);
  }

}
