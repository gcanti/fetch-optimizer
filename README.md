```js
// queries.js

import { Poset, optimize } from 'fetch-optimizer';

const queries = {
  q1: () => new Promise(resolve => setTimeout(resolve('q1'), 200)),
  q2: () => new Promise(resolve => setTimeout(resolve('q2'), 50)),
  q2: () => new Promise(resolve => setTimeout(resolve('q3'), 150))
};

const dependencies = new Poset()
  .addEdge('a', 'b')
  .addEdge('a', 'c');

optimize(dependencies, queries).then(res => console.log('end'));
```

```sh
DEBUG=optimize node queries.js
```

Console output:

```sh
optimize the following tasks will run in parallel: ["q2","q3"] with input: null +0ms
optimize task `q2` returns: "q2" +53ms
optimize task `q3` returns: "q3" +100ms
optimize the following tasks will run in parallel: ["q1"] with input: ["q2","q3"] +0ms
optimize task `q1` returns: "q1" +202ms
```
