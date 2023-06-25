import { carregarMedicoesDoTipo } from './medicoes.js';

// modo callback
function main() {
  carregarMedicoesDoTipo('temperatura', function (err, medicoes) {
    if (err) {
      console.log('Erro ao carregar medições:', err);
      return;
    }
    console.log(`Foram encontradas ${medicoes.length} medição(ões):`);
    for (const medicao of medicoes) {
      console.log(`- ts=${medicao.ts} valor=${medicao.valor}`);
    }
  });
}

// modo promise/async await
// async function main() {
//   try {
//     const medicoes = await carregarMedicoesDoTipo('temperatura');
//     console.log(`Foram encontradas ${medicoes.length} medição(ões):`);
//     for (const medicao of medicoes) {
//       console.log(`- ts=${medicao.ts} valor=${medicao.valor}`);
//     }
//   } catch (err) {
//     console.log('Erro ao carregar medições:', err);
//   }
// }

main();
