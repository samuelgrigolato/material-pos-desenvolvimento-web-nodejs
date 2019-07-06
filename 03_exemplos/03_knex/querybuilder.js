

module.exports.knex = require('knex')({
    client: 'pg',
    connection: 'postgres://postgres:postgres@localhost:5432/tarefas1',
    debug: true
});
