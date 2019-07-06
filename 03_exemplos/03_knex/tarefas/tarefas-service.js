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
    return await knex.transaction(async trx => {
        const id = await trx('tarefas')
            .insert({
                id: knex.raw('nextval(\'tarefas_id_seq\')'),
                descricao: tarefa.descricao,
                previsao: tarefa.previsao,
                usuario_id: knex('usuarios').select('id').where('login', usuario)
            })
            .returning('id')
            .then(x => x[0]); // .first() não pode ser usado em inserts

        if (tarefa.etiquetas) {
            await trx.batchInsert('tarefa_etiqueta', tarefa.etiquetas.map(x => ({
                tarefa_id: id,
                etiqueta_id: x
            })));
        }

        return id;
    });
};


module.exports.buscarEtiquetas = async (idTarefa, usuario) => {
    return knex('etiquetas')
        .join('tarefa_etiqueta', 'etiquetas.id', 'tarefa_etiqueta.etiqueta_id')
        .join('tarefas', 'tarefas.id', 'tarefa_etiqueta.tarefa_id')
        .join('usuarios', 'usuarios.id', 'tarefas.usuario_id')
        .select('etiquetas.id', 'etiquetas.descricao')
        .where({
            'tarefa_etiqueta.tarefa_id': idTarefa,
            'usuarios.login': usuario
        });
};
