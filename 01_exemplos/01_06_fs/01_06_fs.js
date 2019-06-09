const fs = require('fs');

const data = fs.readFileSync('lorem.txt', {
    encoding: 'UTF-8'
});
console.log(data);

const options = { encoding: 'UTF-8' };
const callback = (err, data) => {
    if (err) throw err;
    console.log(data);
};
fs.readFile('lorem.txt', options, callback);
console.log('A leitura ainda não ocorreu');
