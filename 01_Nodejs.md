# Introdução ao Node.js

TODO:

- Recapitulando a arquitetura de aplicações web.

- JavaScript no navegador: de simples eventos até SPAs. Evolução das VMs de execução. Single-thread/arquitetura de eventos e seus benefícios/prejuízos.

- Surgimento do Node.js: uso de JavaScript fora do navegador. História da ferramenta. Instalação e gestão de versões com nvm. Exemplos de código variados. Debugging (v7.7+) manual (node inspect), no Chrome e no vscode.

https://nodejs.org/dist/latest-v10.x/docs/api/readline.html

- Principais diferenças do Node.js com o JavaScript do navegador: cadê o DOM? módulos com CommonJS, API de acesso ao sistema de arquivos, API para servir HTTP, API para clusterização, API de eventos.

https://nodejs.org/dist/latest-v10.x/docs/api/modules.html

- Desenvolvimento dos seguintes endpoints (junto com um front-end básico usando Angular puro) usando nada além do fornecido direto no nodejs:

GET /crypto-currencies
POST /crypto-currencies
GET/PUT/PATCH/DELETE /crypto-currencies/{id}
PUT /crypto-currencies/{id}/exchange-rates
POST /crypto-currencies/exchange-rates
  json, csv
GET /crypto-currencies/exchange-rates/quote?from=&to=

- Adição de mecanismo de segurança (Basic, via login com sessão usando node-session e via JWT).
