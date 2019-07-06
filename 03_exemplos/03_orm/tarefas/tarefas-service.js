const { Tarefa } = require('./tarefas-modelo');
const { Usuario } = require('../usuarios/usuarios-modelo');


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
