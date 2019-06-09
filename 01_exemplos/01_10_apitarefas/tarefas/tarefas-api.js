const tarefas = require('./tarefas-modelo');


function extrairId(path) {
    const partes = path.split('/');
    return parseInt(partes[2]);
}


function get(req, res, data, path, queryParams) {
    const filtro = queryParams['filtro'];
    const registros = tarefas.listar(filtro);
    res.write(JSON.stringify(registros.map(x => {
        return {
            id: x.id,
            descricao: x.descricao,
            concluida: x.conclusao != null
        };
    })));
}


function getById(req, res, data, path, queryParams) {
    const id = extrairId(path);
    const registro = tarefas.buscarPorId(id);
    res.write(JSON.stringify({
        descricao: registro.descricao,
        criacao: registro.criacao,
        conclusao: registro.conclusao,
        previsao: registro.previsao
    }));
}


function post(req, res, data, path, queryParams) {
    const obj = JSON.parse(data);
    const descricao = obj['descricao'];
    const previsao = obj['previsao'] ?
        new Date(obj['previsao']) : null;
    const registro = new tarefas.Tarefa(descricao, previsao);
    tarefas.cadastrar(registro);
}


function del(req, res, data, path, queryParams) {
    const id = extrairId(path);
    tarefas.excluir(id);
}


function finalizar(req, res, data, path, queryParams) {
    const id = extrairId(path);
    tarefas.concluir(id);
}


function reabrir(req, res, data, path, queryParams) {
    const id = extrairId(path);
    tarefas.reabrir(id);
}


function alterarDescricao(req, res, data, path, queryParams) {
    const id = extrairId(path);
    const descricao = data;
    tarefas.alterarDescricao(id, descricao);
}


function alterarPrevisao(req, res, data, path, queryParams) {
    const id = extrairId(path);
    const previsao = new Date(data);
    tarefas.alterarPrevisao(id, previsao);
}


module.exports.processar = function (req, res, data, path, queryParams) {
    const method = req.method;
    if (method == 'GET' && path.startsWith('/tarefas/')) {
        getById(req, res, data, path, queryParams);
    } else if (method == 'GET' && path === '/tarefas') {
        get(req, res, data, path, queryParams);
    } else if (method == 'POST' && path === '/tarefas') {
        post(req, res, data, path, queryParams);
    } else if (method == 'DELETE' && path.startsWith('/tarefas/')) {
        del(req, res, data, path, queryParams);
    } else if (method == 'POST' && path.endsWith('/finalizar')) {
        finalizar(req, res, data, path, queryParams);
    } else if (method == 'POST' && path.endsWith('/reabrir')) {
        reabrir(req, res, data, path, queryParams);
    } else if (method == 'PUT' && path.endsWith('/descricao')) {
        alterarDescricao(req, res, data, path, queryParams);
    } else if (method == 'PUT' && path.endsWith('/previsao')) {
        alterarPrevisao(req, res, data, path, queryParams);
    } else {
        res.statusCode = 404;
    }
}
