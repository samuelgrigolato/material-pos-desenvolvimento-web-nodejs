const fs = require('fs');
const readline = require('readline');

const reader = readline.createInterface(process.stdin, process.stdout);

fs.promises.readFile('dados2.txt', { encoding: 'UTF-8' })
    .then(data => {
        console.log(data);
        return new Promise((resolve, _) => {
            reader.question('Linha: ', linha => resolve(linha));
        });
    })
    .then(linha => fs.promises.appendFile('dados.txt', linha + '\n'))
    .then(() => reader.close())
    .catch(err => {
        console.log(`Erro: ${err}`);
        reader.close();
    });
