const moment = require('moment');


module.exports.listar = usuario => {
    return Promise.resolve([{
        id: 1,
        descricao: 'Tarefa 1',
        previsao: moment(),
        conclusao: null,
        usuario: {
            login: 'samuel'
        }
    }]);
};


module.exports.buscarPorId = id => {
    return Promise.resolve({
        id,
        descricao: 'Tarefa 1',
        previsao: moment(),
        conclusao: null,
        usuario: {
            login: 'samuel'
        }
    });
};
