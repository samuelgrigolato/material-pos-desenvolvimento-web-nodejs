//const readline = require('readline');
import * as readline from 'readline';

const reader = readline.createInterface(process.stdin, process.stdout);
reader.question('Seu nome: ', nome => {
    console.log(`Olá, ${nome}!`);
});
reader.addListener("line", linha => {
    if (linha.toLowerCase() === 'sair') {
        reader.close();
    }
});
