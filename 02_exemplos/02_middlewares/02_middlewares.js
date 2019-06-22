const express = require('express');
const url = require('url');
const app = express();

app.use((req, res, next) => {
    console.log('Interceptando a requisição: ', req.url);
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.path.startsWith('/admin')) {
        const senha = req.header('X-SenhaAdmin');
        if (senha === 'senha123') {
            next();
        } else {
            res.status(403).send('Apenas administradores podem acessar este recurso');
        }
    } else {
        next();
    }
});

app.get('/clientes', (req, res) => res.send(['João', 'Maria']));

app.get('/admin/clientes/restritos', (req, res) => res.send(['João']));

app.listen(3000);
