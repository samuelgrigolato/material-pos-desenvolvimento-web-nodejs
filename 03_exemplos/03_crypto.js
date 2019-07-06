const crypto = require('crypto');

console.log(crypto.createHash('sha256')
    .update('123456')
    .digest());

console.log(crypto.createHash('sha256')
    .update('123456')
    .digest('hex'));

console.log(crypto.createHash('sha256')
    .update('123456')
    .digest('base64'));

const senha = '123456';
const salt = 'segredo';
let resultado = `${salt}${senha}`;
for (let i = 0; i < 10; i++) {
    resultado = crypto.createHash('sha256')
        .update(resultado)
        .digest();
}
console.log(resultado);
