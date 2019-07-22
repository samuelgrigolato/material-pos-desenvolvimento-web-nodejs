const request = require('request');
const circuitBreaker = require('opossum');


const cotar = circuitBreaker(async function (solicitacao) {
    const idMarca = await buscarMarca(solicitacao.marca);
    const idModelo = await buscarModelo(idMarca, solicitacao.modelo);
    const valorFipe = await buscarValor(idMarca, idModelo, solicitacao.ano);
    const valor = calcularValor(valorFipe, solicitacao.quantidade);
    return enviarEmail(valor, solicitacao.email);
}, {
    errorThresholdPercentage: 50
});
module.exports.cotar = solicitacao => cotar.fire(solicitacao);


function buscarMarca(marca) {
    return new Promise((resolve, reject) => {
        request('https://parallelum.com.br/fipe/api/v1/carros/marcas', { json: true }, (err, _, body) => {
            if (err) {
                reject(err);
                return;
            }
            const registro = body.filter(x => x.nome.toLowerCase() == marca.toLowerCase())[0];
            if (registro) {
                resolve(registro.codigo);
            } else {
                reject({ dadosInvalidos: true, detalhes: 'Marca não encontrada' });
            }
        });
    });
}


function buscarModelo(idMarca, modelo) {
    return new Promise((resolve, reject) => {
        request(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${idMarca}/modelos`, { json: true }, (err, _, body) => {
            if (err) {
                reject(err);
                return;
            }
            const registro = body.modelos.filter(x => x.nome.toLowerCase() == modelo.toLowerCase())[0];
            if (registro) {
                resolve(registro.codigo);
            } else {
                reject({ dadosInvalidos: true, detalhes: 'Modelo não encontrado' });
            }
        });
    });
}


function buscarValor(idMarca, idModelo, ano) {
    return new Promise((resolve, reject) => {
        request(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${idMarca}/modelos/${idModelo}/anos/${ano}`, { json: true }, (err, resp, body) => {
            if (err) {
                reject(err);
                return;
            }
            if (resp.statusCode == 404) {
                reject({ dadosInvalidos: true, detalhes: 'Ano não encontrado' });
                return;
            }
            const valor = parseFloat(body.Valor
                .substring("R$ ".length)
                .replace('.', '')
                .replace(',', '.'));
            resolve(valor);
        });
    });
}


function calcularValor(valorFipe, quantidade) {
    // 1% por unidade, máximo de 5%
    return valorFipe * (1 - Math.min(0.05, (0.01 * quantidade)));
}


function enviarEmail(valor, email) {
    return new Promise((resolve, reject) => {
        request(`http://emails.localhost:8083/enviar`, {
            json: true,
            method: 'POST',
            body: {
                assunto: 'Sua cotação foi processada',
                texto: `Valor da cotação: ${valor}`,
                para: email
            }
        }, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            if (resp.statusCode != 204) {
                reject(`${resp.statusCode} ${resp.statusMessage}`);
                return;
            }
            resolve();
        });
    });
}
