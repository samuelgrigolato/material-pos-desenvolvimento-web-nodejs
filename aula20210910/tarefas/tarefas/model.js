import util from 'util';

const pausar = util.promisify(setTimeout);

let sequencial = 0;
const tarefas = [];

export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new Error('Usuário não autenticado.');
  }
  await pausar(25);
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    descricao: tarefa.descricao
  });
  return sequencial;
}

export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new Error('Usuário não autenticado.');
  }
  await pausar(25);
  let resultado = tarefas.filter(x => x.loginDoUsuario === loginDoUsuario);
  if (termo !== undefined && termo !== null) {
    const termoLowerCase = termo.toLocaleLowerCase();
    resultado = resultado.filter(x => x.descricao.toLocaleLowerCase().includes(termoLowerCase));
  }
  return resultado;
}
