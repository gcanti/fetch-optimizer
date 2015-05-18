'use strict';

exports.__esModule = true;
exports.optimize = optimize;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var SOURCE = 'fetch-optimizer';
var log = (0, _debug2['default'])(SOURCE);

var options = {
  Promise: Promise
};

exports.options = options;

function optimize(dependencies, fetchers) {
  var upset = dependencies.getUpsetPoset(fetchers);
  if (process.env.NODE_ENV !== 'production') {
    for (var fetcher in upset.nodes) {
      if (!fetchers.hasOwnProperty(fetcher)) {
        throw new Error('' + SOURCE + ' cannot optimize: fetcher "' + fetcher + '" is missing');
      }
    }
  }
  var chain = upset.toChain();
  var init = options.Promise.resolve(null);
  return chain.reduce(function (promise, rank) {
    var names = Object.keys(rank);
    return promise.then(function (res) {
      log('the following fetchers will run in parallel: %j with input: %j', names, res);
      var promises = names.map(function (name) {
        var promise = fetchers[name](res);
        return promise.then(function (res) {
          log('fetcher `%s` returns: %j', name, res);
          return res;
        });
      });
      return options.Promise.all(promises);
    });
  }, init);
}

function _isEmpty(hash) {
  for (var k in hash) {
    return false;
  }
  return true;
}

function merge(a, b) {
  for (var k in b) {
    a[k] = b[k];
  }
  return a;
}

var Poset = (function () {
  function Poset() {
    var nodes = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Poset);

    this.nodes = nodes;
  }

  Poset.prototype.isEmpty = function isEmpty() {
    return _isEmpty(this.nodes);
  };

  Poset.prototype.addNode = function addNode(node) {
    this.nodes[node] = this.nodes[node] || {};
    return this;
  };

  Poset.prototype.addEdge = function addEdge(from, to) {
    this.addNode(from).addNode(to);
    this.nodes[from][to] = 1;
    return this;
  };

  Poset.prototype.getEdges = function getEdges(node) {
    if (this.nodes.hasOwnProperty(node)) {
      return this.nodes[node];
    } else if (process.env.NODE_ENV !== 'production') {
      throw new Error('' + SOURCE + ' unknown node ' + node);
    }
  };

  Poset.prototype.hasEdges = function hasEdges(node) {
    return !_isEmpty(this.getEdges(node));
  };

  Poset.prototype.getMaximalElements = function getMaximalElements() {
    var ret = {};
    for (var node in this.nodes) {
      if (!this.hasEdges(node)) {
        ret[node] = 1;
      }
    }
    return ret;
  };

  Poset.prototype.toChain = function toChain() {
    var poset = this;
    var ret = [];
    while (!poset.isEmpty()) {
      var roots = poset.getMaximalElements();
      ret.push(roots);
      var nodes = {};
      for (var node in poset.nodes) {
        if (!roots.hasOwnProperty(node)) {
          nodes[node] = {};
          var edges = poset.getEdges(node);
          for (var to in edges) {
            if (!roots.hasOwnProperty(to)) {
              nodes[node][to] = edges[to] || 1;
            }
          }
        }
      }
      poset = new Poset(nodes);
    }
    return ret;
  };

  Poset.prototype.getUpsetPoset = function getUpsetPoset(nodes) {
    var _this = this;

    var ret = {};
    var addNodes = function addNodes(nodes) {
      for (var node in nodes) {
        if (_this.nodes.hasOwnProperty(node)) {
          if (!ret.hasOwnProperty(node)) {
            var edges = _this.getEdges(node);
            ret[node] = edges;
            addNodes(edges);
          }
        } else if (process.env.NODE_ENV !== 'production') {
          throw new Error('' + SOURCE + ' unknown node ' + node);
        }
      }
    };
    addNodes(nodes);
    return new Poset(ret);
  };

  return Poset;
})();

exports.Poset = Poset;