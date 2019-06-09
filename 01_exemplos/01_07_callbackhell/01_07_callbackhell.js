const fs = require('fs');
const readline = require('readline');

const reader = readline.createInterface(process.stdin, process.stdout);

fs.readFile('dados.txt', { encoding: 'UTF-8' }, (err, data) => {
    if (err) throw err;
    console.log(data);
    reader.question('Linha: ', linha => {
        fs.appendFile('dados.txt', linha + '\n', err => {
            if (err) throw err;
            reader.close();
        });
    });
});
