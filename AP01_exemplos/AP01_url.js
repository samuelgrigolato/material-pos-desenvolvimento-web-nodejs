const http = require('http');
const url = require('url');


const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    res.write(JSON.stringify(reqUrl));
    res.end();
});
server.listen(8080);
