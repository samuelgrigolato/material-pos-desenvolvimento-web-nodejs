
const startInMillis = new Date().getTime();
let soma = 0;
for (let i = 0; i < 10000000000; i++) {
    soma += i;
}
console.log(soma);
const endInMillis = new Date().getTime();
const durationInMillis = endInMillis - startInMillis;
console.log(durationInMillis);
