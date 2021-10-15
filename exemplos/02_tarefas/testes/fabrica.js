
export async function fabricarCategoria (trx) {
  const res = await trx('categorias')
    .insert({ descricao: 'Categoria Teste' })
    .returning('id');
  return res[0];
}

export async function fabricarUsuario (trx, { login } = {}) {
  const res = await trx('usuarios')
    .insert({
      nome: 'Usuário Teste',
      login: login || 'usuario',
      senha: '123456'
    })
    .returning('id');
  return res[0];
}

export async function fabricarTarefa (trx, { idUsuario, idCategoria }) {
  const res = await trx('tarefas')
    .insert({
      descricao: 'Tarefa Teste',
      id_usuario: idUsuario,
      id_categoria: idCategoria || await fabricarCategoria(trx)
    })
    .returning('id');
  return res[0];
}

export async function fabricarEtiqueta (trx, { descricao, cor } = {}) {
  const res = await trx('etiquetas')
    .insert({
      descricao: descricao || 'Etiqueta Teste',
      cor: cor || 'white'
    })
    .returning('id');
  return res[0];
}
