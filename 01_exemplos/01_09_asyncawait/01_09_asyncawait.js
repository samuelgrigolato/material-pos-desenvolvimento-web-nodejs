const fs = require('fs');
const readline = require('readline');

const reader = readline.createInterface(process.stdin, process.stdout);

async function main() {
    try {
        const data = await fs.promises.readFile('dados.txt', { encoding: 'UTF-8' });
        console.log(data);
        const linha = await new Promise((resolve, _) => {
            reader.question('Linha: ', linha => resolve(linha));
        });
        await fs.promises.appendFile('dados.txt', linha + '\n');
    } catch (err) {
        console.log(`Erro: ${err}`);
    } finally {
        reader.close();
    }
}

console.log(main());

async function soma(a, b) {
    return a + b;
}
console.log(soma(1, 2));
soma(2, 3).then(res => console.log(res));
