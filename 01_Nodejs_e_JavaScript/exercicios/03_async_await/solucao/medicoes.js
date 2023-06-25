import fs from 'fs';

// modo callback (conferir app.js)
// export function carregarMedicoesDoTipo(tipo, callback) {
//   fs.readFile('medicoes.jsonl', 'utf-8', function (err, data) {
//     if (err) {
//       callback(err, undefined);
//     } else {
//       const linhas = data.split('\n');
//       const medicoes = linhas.map(JSON.parse);
//       const filtradas = medicoes.filter(m => m.tipo === tipo);
//       callback(undefined, filtradas);
//     }
//   });
// };

// modo promises (conferir app.js)
// export function carregarMedicoesDoTipo(tipo) {
//   return fs.promises.readFile('medicoes.jsonl', 'utf-8')
//     .then(data => {
//       const linhas = data.split('\n');
//       const medicoes = linhas.map(JSON.parse);
//       return medicoes.filter(m => m.tipo === tipo);
//     });
// };

// modo async/await (conferir app.js)
export async function carregarMedicoesDoTipo(tipo) {
  const data = await fs.promises.readFile('medicoes.jsonl', 'utf-8')
  const linhas = data.split('\n');
  const medicoes = linhas.map(JSON.parse);
  return medicoes.filter(m => m.tipo === tipo);
}
