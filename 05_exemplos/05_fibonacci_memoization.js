const process = require('process');

const memory = {};

const start = process.hrtime();
console.log(fib(1000));
const diff = process.hrtime(start);
console.log(`Tempo de execução: ${diff[0]}s ${diff[1]}ms`);

function fib(n) {
    if (!memory[n]) {
        if (n <= 1) {
            memory[n] = n;
        } else {
            memory[n] = fib(n - 1) + fib(n - 2);
        }
    }
    return memory[n];
}
