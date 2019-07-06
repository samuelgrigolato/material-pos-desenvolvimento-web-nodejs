const Sequelize = require('sequelize');
const { sequelize } = require('../orm');


module.exports.Usuario = sequelize.define('usuario', {
    login: {
        type: Sequelize.STRING,
        allowNull: false
    },
    senha: {
        type: Sequelize.BLOB,
        allowNull: false
    }
});
