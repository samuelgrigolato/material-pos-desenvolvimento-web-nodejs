const { Tarefa } = require('./tarefas-modelo');
const { Usuario } = require('../usuarios/usuarios-modelo');
const { knex } = require('../querybuilder');


module.exports.listar = usuario => {
    return Tarefa.findAll({
        include: [{
            model: Usuario,
            where: { login: usuario }
        }]
    });
};


module.exports.buscarPorId = id => {
    return Tarefa.findByPk(id, {
        include: [{
            model: Usuario
        }]
    });
};


module.exports.cadastrar = async (tarefa, usuario) => {
    return knex('tarefas')
        .insert({
            id: knex.raw('nextval(\'tarefas_id_seq\')'),
            descricao: tarefa.descricao,
            previsao: tarefa.previsao,
            usuario_id: knex('usuarios').select('id').where('login', usuario)
        })
        .returning('id')
        .then(x => x[0]); // .first() não pode ser usado em inserts
};
