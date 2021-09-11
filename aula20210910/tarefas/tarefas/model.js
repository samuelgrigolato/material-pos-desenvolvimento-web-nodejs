import util from 'util';

const pausar = util.promisify(setTimeout);

let sequencial = 3;
const tarefas = [
  {
    id: 1,
    descricao: 'Comprar leite.',
    loginDoUsuario: 'pedro'
  },
  {
    id: 2,
    descricao: 'Trocar lâmpada.',
    loginDoUsuario: 'pedro'
  },
  {
    id: 3,
    descricao: 'Instalar torneira.',
    loginDoUsuario: 'clara'
  }
];

export async function cadastrarTarefa (tarefa, usuario) {
  if (usuario === undefined) {
    throw new Error('Usuário não autenticado.');
  }
  const loginDoUsuario = usuario.login;
  await pausar(25);
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    descricao: tarefa.descricao
  });
  return sequencial;
}

export async function consultarTarefas (termo, usuario) {
  if (usuario === undefined) {
    throw new Error('Usuário não autenticado.');
  }
  await pausar(25);

  const loginDoUsuario = usuario.login;
  const usuarioAdmin = usuario.admin;

  let resultado = usuarioAdmin ?
    tarefas :
    tarefas.filter(x => x.loginDoUsuario === loginDoUsuario);

  if (termo !== undefined && termo !== null) {
    const termoLowerCase = termo.toLocaleLowerCase();
    resultado = resultado.filter(x => x.descricao.toLocaleLowerCase().includes(termoLowerCase));
  }
  return resultado;
}
