const http = require('http');
const querystring = require('querystring');
const tarefas = require('./tarefas/tarefas-api');


const server = http.createServer((req, res) => {
    let data = "";
    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', () => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const url = req.url.split('?');
            const path = url[0];
            const queryParams = url.length > 1 ? querystring.parse(url[1]) : {};
            if (path.startsWith('/tarefas')) {
                tarefas.processar(req, res, data, path, queryParams);
            } else {
                res.statusCode = 404;
            }
        } catch (err) {
            console.error(err);
            res.statusCode = 500;
        } finally {
            res.end();
        }
    });
});
server.listen(8080);
