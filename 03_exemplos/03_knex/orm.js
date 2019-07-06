const Sequelize = require('sequelize');


module.exports.sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/tarefas1', {
    define: {
        timestamps: false,
        underscored: true
    }
});
