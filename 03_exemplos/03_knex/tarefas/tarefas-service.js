const uuidv4 = require('uuid/v4');
const { Tarefa } = require('./tarefas-modelo');
const { Usuario } = require('../usuarios/usuarios-modelo');
const { knex } = require('../querybuilder');
const { mesclar } = require('../colecoes');


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
        const id = await inserirTarefa(trx, tarefa, usuario);
        await inserirEtiquetas(trx, id, tarefa);
        await inserirChecklists(trx, id, tarefa);
        return id;
    });
};


function inserirTarefa(trx, tarefa, usuario) {
    return trx('tarefas')
        .insert({
            id: knex.raw('nextval(\'tarefas_id_seq\')'),
            descricao: tarefa.descricao,
            previsao: tarefa.previsao,
            usuario_id: knex('usuarios').select('id').where('login', usuario)
        })
        .returning('id')
        .then(x => x[0]); // .first() não pode ser usado em inserts
}


function inserirEtiquetas(trx, idTarefa, tarefa) {
    if (tarefa.checklists) {
        return Promise.all(tarefa.checklists.map(async checklist => {
            const idChecklist = uuidv4();
            await trx('checklists').insert({
                id: idChecklist,
                tarefa_id: idTarefa,
                descricao: checklist.descricao
            });
            await inserirItemsChecklist(trx, idChecklist, checklist);
        }));
    } else {
        return Promise.resolve();
    }
}


function inserirChecklists(trx, idTarefa, tarefa) {
    if (tarefa.etiquetas) {
        return trx.batchInsert('tarefa_etiqueta', tarefa.etiquetas.map(x => ({
            tarefa_id: idTarefa,
            etiqueta_id: x
        })));
    } else {
        return Promise.resolve();
    }
}


function inserirItemsChecklist(trx, idChecklist, checklist) {
    if (checklist.items) {
        return trx.batchInsert('items_checklist', checklist.items.map(x => ({
            id: uuidv4(),
            checklist_id: idChecklist,
            descricao: x.descricao,
            completado: x.completado
        })));
    } else {
        return Promise.resolve();
    }
}


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


const buscarChecklists = async (idTarefa, usuario) => {
    return knex('checklists')
        .leftJoin('items_checklist', 'items_checklist.checklist_id', 'checklists.id')
        .join('tarefas', 'tarefas.id', 'checklists.tarefa_id')
        .join('usuarios', 'usuarios.id', 'tarefas.usuario_id')
        .select(
            knex.ref('checklists.id').as('checkId'),
            knex.ref('checklists.descricao').as('checkDesc'),
            knex.ref('items_checklist.id').as('itemId'),
            knex.ref('items_checklist.descricao').as('itemDesc'),
            knex.ref('items_checklist.completado').as('itemCompl')
        )
        .where({
            'checklists.tarefa_id': idTarefa,
            'usuarios.login': usuario
        })
        .then(async res => {
            const checklists = {};
            res.forEach(linha => {
                if (!checklists[linha.checkId]) {
                    checklists[linha.checkId] = {
                        id: linha.checkId,
                        descricao: linha.checkDesc,
                        items: []
                    };
                }
                if (linha.itemId) {
                    checklists[linha.checkId].items.push({
                        id: linha.itemId,
                        descricao: linha.itemDesc,
                        completado: linha.itemCompl
                    });
                }
            });
            return Object.values(checklists);
        });
};
module.exports.buscarChecklists = buscarChecklists;


module.exports.alterarChecklists = (idTarefa, checklists, usuario) => {
    return knex.transaction(async trx => {
        await validarPermissaoDeAcesso(idTarefa, usuario);
        const origem = checklists;
        const destino = await buscarChecklists(idTarefa, usuario);
        await mesclar(origem, destino,
            (x, y) => x.id === y.id,

            // criar
            x => inserirChecklist(trx, idTarefa, x),

            // atualizar
            (x, y) => atualizarChecklist(trx, x, y),
            
            // remover
            x => removerChecklist(trx, x));
    });
};


async function validarPermissaoDeAcesso(idTarefa, usuario) {
    const res = await knex('tarefas')
        .join('usuarios', 'usuarios.id', 'tarefas.usuario_id')
        .where({
            'usuarios.login': usuario,
            'tarefas.id': idTarefa
        })
        .count()
        .first();
    if (res.count <= 0) {
        throw Error('Acesso negado!');
    }
}


function inserirChecklist(trx, idTarefa, checklist) {
    const idChecklist = checklist.id || uuidv4();
    return trx('checklists')
        .insert({
            id: idChecklist,
            tarefa_id: idTarefa,
            descricao: checklist.descricao
        })
        .then(() => inserirItemsChecklist(trx, idChecklist, checklist));
}


function atualizarChecklist(trx, novo, existente) {
    return trx('checklists')
        .where({ id: existente.id })
        .update({ descricao: novo.descricao })
        .then(() => atualizarItemsChecklist(trx, novo, existente));
}


function atualizarItemsChecklist(trx, novo, existente) {
    const origem = novo.items || [];
    const destino = existente.items;
    return mesclar(origem, destino,
        (x, y) => x.id === y.id,
        
        // criar
        x => trx('items_checklist').insert({
            id: x.id || uuidv4(),
            checklist_id: existente.id,
            descricao: x.descricao,
            completado: x.completado
        }),
        
        // atualizar
        (x, y) => trx('items_checklist').where({ id: y.id }).update({
            descricao: x.descricao,
            completado: x.completado
        }),
        
        // remover
        x => trx('items_checklist').where({ id: x.id }).del());
}


function removerChecklist(trx, checklist) {
    return trx('items_checklist')
        .where({ checklist_id: checklist.id })
        .del()
        .then(() => trx('checklists')
            .where({ id: checklist.id })
            .del());
}
