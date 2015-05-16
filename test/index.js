'use strict';

var assert = require('assert');
var Poset = require('../.').Poset;
var optimize = require('../.').optimize;

describe('Poset', function () {

  it('constructor', function () {
    var poset = new Poset();
    assert.deepEqual(poset.nodes, {});
  });

  it('isEmpty', function () {
    var poset = new Poset();
    assert.strictEqual(poset.isEmpty(), true);
    poset = new Poset().addNode('a');
    assert.strictEqual(poset.isEmpty(), false);
  });

  it('addNode', function () {
    var poset = new Poset()
      .addNode('a');
    assert.deepEqual(poset.nodes, {a: {}});
    // chaining
    poset.addNode('b').addNode('c');
    assert.deepEqual(poset.nodes, {a: {}, b: {}, c: {}});
  });

  it('addEdge', function () {
    var poset = new Poset();
    poset.addEdge('a', 'b');
    assert.deepEqual(poset.nodes, {a: {b: 1}, b: {}});
  });

  it('hasEdges', function () {
    var poset = new Poset()
      .addEdge('a', 'b');
    assert.strictEqual(poset.hasEdges('a'), true);
    assert.strictEqual(poset.hasEdges('b'), false);
  });

  it('getRoots', function () {
    var poset = new Poset()
      .addEdge('a', 'b');
    var roots = poset.getRoots();
    assert.deepEqual(roots, {b: 1});
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

  it('getSubPoset', function () {
    var poset = new Poset()
      .addEdge('a', 'b')
      .addEdge('b', 'c');
    var subPoset = poset.getSubPoset({a: 1, c: 1});
    assert.deepEqual(subPoset.nodes, {a: {c: 1}, c: {}});

    poset = new Poset()
      .addEdge('a', 'b')
      .addEdge('b', 'c')
      .addEdge('b', 'd');
    subPoset = poset.getSubPoset({a: 1, c: 1, d: 1});
    assert.deepEqual(subPoset.nodes, {a: {c: 1, d: 1}, c: {}, d: {}});

    poset = new Poset()
      .addEdge('h', 'f')
      .addEdge('h', 'g')
      .addEdge('f', 'c')
      .addEdge('g', 'd')
      .addEdge('c', 'b')
      .addEdge('d', 'b')
      .addEdge('e', 'b')
      .addEdge('b', 'a');
    subPoset = poset.getSubPoset({b: 1, c: 1, e: 1, f: 1, g: 1});
    assert.deepEqual(subPoset.nodes, {f: {c: 1}, g: {b: 1}, c: {b: 1}, e: {b: 1}, b: {}});
  });

  it('should return the chain of a sub Poset', function () {
    var poset = new Poset()
      .addEdge('h', 'f')
      .addEdge('h', 'g')
      .addEdge('f', 'c')
      .addEdge('g', 'd')
      .addEdge('c', 'b')
      .addEdge('d', 'b')
      .addEdge('e', 'b')
      .addEdge('b', 'a');
    var subPoset = poset.getSubPoset({b: 1, c: 1, e: 1, f: 1, g: 1});
    var chain = subPoset.toChain();
    assert.deepEqual(chain, [{b: 1}, {c: 1, e: 1, g: 1}, {f: 1}]);
  });

});

describe('optimize', function () {

  function buildThen(value, delay, result) {
    return function (res) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          result.push(value);
          resolve(value);
        }, delay);
      });
    };
  }

  it('should return an resolved promise', function (done) {
    var result = [];

    var queries = {};

    var dependencies = new Poset()

    var promise = optimize(dependencies, queries);

    promise.then(function (res) {
      assert.deepEqual(result, []);
      assert.deepEqual(res, null);
      done();
    });
  });

  it('should return an optimized promise', function (done) {
    var result = [];

    var queries = {
      q1: buildThen('q1', 200, result),
      q2: buildThen('q2', 50, result),
      q3: buildThen('q3', 150, result)
    };

    var dependencies = new Poset()
      .addEdge('q1', 'q2')
      .addEdge('q1', 'q3');

    var promise = optimize(dependencies, queries);

    promise.then(function (res) {
      assert.deepEqual(result, ['q2', 'q3', 'q1']);
      assert.deepEqual(res, ['q1']);
      done();
    });
  });

});