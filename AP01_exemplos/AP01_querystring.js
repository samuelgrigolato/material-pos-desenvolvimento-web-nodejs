const http = require('http');
const querystring = require('querystring');


const server = http.createServer((req, res) => {
    const url = req.url.split('?');
    const path = url[0];
    const queryParams = url.length > 1 ? querystring.parse(url[1]) : {};
    res.write(path + '\n');
    res.write(JSON.stringify(queryParams) + '\n');
    res.end();
});
server.listen(8080);
