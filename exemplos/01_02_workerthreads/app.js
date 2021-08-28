const { Worker, isMainThread } = require('worker_threads');

if (isMainThread) {
  new Worker(__filename);
  new Worker(__filename);
  new Worker(__filename);
  new Worker(__filename);
} else {
  console.log('worker...');
  for (let i = 0; i < 10000000000; i++) {};
}

//for (let i = 0; i < 10000000000; i++) {};
