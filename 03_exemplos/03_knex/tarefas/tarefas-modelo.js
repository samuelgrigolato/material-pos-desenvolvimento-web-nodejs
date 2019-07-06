const Sequelize = require('sequelize');
const { sequelize } = require('../orm');
const { Usuario } = require('../usuarios/usuarios-modelo');


const Tarefa = sequelize.define('tarefa', {
    descricao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    previsao: {
        type: Sequelize.DATE,
        allowNull: false
    },
    conclusao: {
        type: Sequelize.DATE
    }
});
Tarefa.belongsTo(Usuario);

module.exports.Tarefa = Tarefa;
