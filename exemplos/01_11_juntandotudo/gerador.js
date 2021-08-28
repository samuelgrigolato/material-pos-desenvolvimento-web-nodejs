import { open } from 'fs/promises';


async function main () {
  let fd;
  try {
    fd = await open('resultado.txt', 'a');
    for (let i = 0; i < 1000; i++) {
      const numeros = [];
      for (let j = 0; j < 1000; j++) {
        numeros.push(Math.ceil(Math.random() * 100000));
      }
      await fd.appendFile(numeros.join('\n') + '\n');
    }
  } finally {
    if (fd) {
      await fd.close();
    }
  }
}

main();
