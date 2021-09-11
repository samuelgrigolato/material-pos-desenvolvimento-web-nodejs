import util from 'util';

const pausar = util.promisify(setTimeout);

let sequencial = 0;
const tarefas = [];

export async function cadastrarTarefa (tarefa) {
  await pausar(25);
  sequencial++;
  tarefas.push({
    id: sequencial,
    descricao: tarefa.descricao
  });
  return sequencial;
}

export async function consultarTarefas (termo) {
  await pausar(25);
  let resultado = tarefas;
  if (termo !== undefined && termo !== null) {
    const termoLowerCase = termo.toLocaleLowerCase();
    resultado = resultado.filter(x => x.descricao.toLocaleLowerCase().includes(termoLowerCase));
  }
  return resultado;
}
