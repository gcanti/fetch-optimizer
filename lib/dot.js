'use strict';

exports.__esModule = true;
exports.toDot = toDot;

// see https://developers.google.com/chart/image/docs/gallery/graphviz?csw=1
exports.toSrc = toSrc;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function getNode(id) {
  return '' + id + ' [label=' + id + '];';
}

function getEdge(from, to) {
  return '' + from + ' -> ' + to + ';';
}

function getEdges(node, edges) {
  return Object.keys(edges).map(function (to) {
    return getEdge(to, node);
  }).join('\n');
}

function toDot(poset) {
  var dot = 'digraph poset {\n';
  dot += Object.keys(poset.nodes).map(getNode).join('\n');
  dot += '\n';
  dot += Object.keys(poset.nodes).map(function (node) {
    return getEdges(node, poset.nodes[node]);
  }).join('');
  dot += '\n}';
  return dot;
}

var GOOGLE_API = 'https://chart.googleapis.com/chart?';
function toSrc(poset) {
  var options = arguments[1] === undefined ? {} : arguments[1];

  var dot = toDot(poset);
  var _options$engine = options.engine;
  var engine = _options$engine === undefined ? 'dot' : _options$engine;

  var ret = GOOGLE_API + _querystring2['default'].stringify({
    cht: 'gv:' + engine,
    chl: dot
  });
  return ret;
}