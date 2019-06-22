let ID = 1;
const REGISTROS = [];


class Tarefa {
  constructor(descricao, previsao) {
    this.id = ID;
    ID++;
    this.descricao = descricao;
    this.previsao = previsao;
    this.criacao = new Date();
    this.conclusao = null;
  }
};
module.exports.Tarefa = Tarefa;


REGISTROS.push(new Tarefa('Terminar essa API', null));
REGISTROS.push(new Tarefa('Ir embora', new Date()));


module.exports.listar = function (filtro) {
  if (!filtro) {
    return REGISTROS;
  } else {
    const lower = filtro.toLowerCase();
    return REGISTROS.filter(x => x.descricao.toLowerCase().indexOf(lower) >= 0);
  }
};


function buscarPorId (id) {
  return REGISTROS.filter(x => x.id == id)[0];
}
module.exports.buscarPorId = buscarPorId;


module.exports.cadastrar = function (tarefa) {
  REGISTROS.push(tarefa);
};


module.exports.alterarDescricao = function (id, descricao) {
  buscarPorId(id).descricao = descricao;
};


module.exports.alterarPrevisao = function (id, previsao) {
  buscarPorId(id).previsao = previsao;
};


module.exports.concluir = function (id) {
  buscarPorId(id).conclusao = new Date();
};


module.exports.reabrir = function (id) {
  buscarPorId(id).conclusao = null;
};


module.exports.excluir = function (id) {
  const registro = buscarPorId(id);
  const idx = REGISTROS.indexOf(registro);
  REGISTROS.splice(idx, 1);
}
