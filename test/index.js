'use strict';

var assert = require('assert');
var Poset = require('../.').Poset;
var optimize = require('../.').optimize;

describe('Poset', function () {

  it('constructor', function () {
    assert.deepEqual(new Poset().nodes, {});
  });

  it('isEmpty', function () {
    assert.strictEqual(new Poset().isEmpty(), true);
    assert.strictEqual(new Poset().addNode('a').isEmpty(), false);
  });

  it('addNode', function () {
    var poset = new Poset()
      .addNode('a')
      .addNode('b');
    assert.deepEqual(poset.nodes, {a: {}, b: {}});
  });

  it('addEdge', function () {
    var poset = new Poset()
      .addEdge('a', 'b')
      .addEdge('b', 'c');
    assert.deepEqual(poset.nodes, {a: {b: 1}, b: {c: 1}, c: {}});
  });

  it('hasEdges', function () {
    var poset = new Poset()
      .addEdge('a', 'b');
    assert.strictEqual(poset.hasEdges('a'), true);
    assert.strictEqual(poset.hasEdges('b'), false);
  });

  it('getMaximalElements', function () {
    var poset = new Poset()
      .addEdge('a', 'b')
      .addEdge('a', 'c');
    var roots = poset.getMaximalElements();
    assert.deepEqual(roots, {b: 1, c: 1});
  });

  it('toChain', function () {
    var poset = new Poset()
      .addEdge('c', 'a')
      .addEdge('c', 'b');
    var chain = poset.toChain();
    assert.deepEqual(chain, [{ a: 1, b: 1 }, { c: 1 }]);

    poset = new Poset()
      .addEdge('h', 'f')
      .addEdge('h', 'g')
      .addEdge('f', 'c')
      .addEdge('g', 'd')
      .addEdge('c', 'b')
      .addEdge('d', 'b')
      .addEdge('e', 'b')
      .addEdge('b', 'a');
    chain = poset.toChain();
    assert.deepEqual(chain, [{a: 1}, {b: 1}, {c: 1, d: 1, e: 1}, {f: 1, g: 1}, {h: 1}]);
  });

  describe('getUpsetPoset', function () {

    it('should throw if unknown nodes are used', function () {
      var poset = new Poset();
      assert.throws(function () {
        poset.getUpsetPoset({a: 1, c: 1});
      });
    });

    it('should return the whole poset if a bottom element is chosen', function () {
      var poset = new Poset()
        .addEdge('a', 'b')
        .addEdge('b', 'c');
      var upsetPoset = poset.getUpsetPoset({a: 1});
      assert.deepEqual(upsetPoset.nodes, poset.nodes);

    });

    it('should return the union of upsets', function () {
      var poset = new Poset()
        .addEdge('a', 'c')
        .addEdge('b', 'c')
        .addEdge('c', 'd');
      var upsetPoset = poset.getUpsetPoset({a: 1});
      assert.deepEqual(upsetPoset.nodes, {a: {c: 1}, c: {d: 1}, d: {}});

    });

  });

});

describe('optimize', function () {

  function getFetcher(value, delay, result) {
    return function (res) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          result.push(value);
          resolve(value);
        }, delay);
      });
    };
  }

  it('should return a resolved promise', function (done) {
    var result = [];
    var fetchers = {};
    var dependencies = new Poset();
    var promise = optimize(dependencies, fetchers);
    promise.then(function (res) {
      assert.deepEqual(result, []);
      assert.deepEqual(res, null);
      done();
    });
  });

  it('should return an optimized promise', function (done) {
    var result = [];
    var fetchers = {
      f1: getFetcher('f1', 200, result),
      f2: getFetcher('f2', 50, result),
      f3: getFetcher('f3', 150, result)
    };
    var dependencies = new Poset()
      .addEdge('f1', 'f2')
      .addEdge('f1', 'f3');
    var promise = optimize(dependencies, fetchers);
    promise.then(function (res) {
      assert.deepEqual(result, ['f2', 'f3', 'f1']);
      assert.deepEqual(res, ['f1']);
      done();
    });
  });

});