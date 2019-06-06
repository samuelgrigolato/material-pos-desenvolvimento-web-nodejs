# Introdução ao Node.js

Antes de discutir sobre Node.js, vale relembrar a estrutura de uma aplicação web.

Mas o que é uma aplicação web? Para os efeitos dessa disciplina, a seguinte definição (texto próprio) será utilizada:

> Uma aplicação web é um software que disponibiliza sua funcionalidade através de conexões de rede, normalmente consumidas por navegadores web através da Internet. Outros clientes (como aplicações em dispositivos móveis) e topologias de rede que não dependem da Internet também são possíveis e não a descaracterizam.

Com base nessa definição, é possível revisitar alguns conceitos chaves para qualquer aplicação web. São eles:

## Protocolo HTTP

É o protocolo mais conhecido e difundido na construção de aplicações web. Baseado no protocolo TCP/IP, define uma abstração para que clientes (dentre eles, navegadores web) efetuem *requisições* e recebam *respostas*.

Durante sua concepção, o protocolo HTTP (junto com a linguagem HTML) tinha um propósito bem diferente do atual: permitir o acesso e modificação de documentos de texto com formatações simples e *links* navegáveis. Para atender a este objetivo, bastava permitir uma comunicação unilateral (partindo do cliente).

## Requisição HTTP

Sempre que um cliente web (ex: navegador) precisa de alguma informação de um servidor (ex: uma página HTML, uma folha de estilo, uma imagem, etc.) ele a solicita através de uma requisição HTTP¹. Essa requisição é composta das seguintes partes:

* **Método:** define o objetivo da requisição. Os principais métodos HTTP são: GET/POST/PUT/PATCH/DELETE.

* **Caminho:** é a parte que fica *depois* do endereço do servidor, incluindo a *query string*. Como exemplo, considere a URL abaixo:

> http://www.minhaaplicacao.com/clientes?nome=Maria

A parte antes do `://`, `http`, é o protocolo de comunicação utilizado para iniciar a conversa com o servidor. `www.minhaaplicacao.com` é um nome completo de domínio (*Fully-Qualified Domain Name*, FQDN), passado pelo sistema de DNS resultando em um endereço IP. Opcionalmente uma porta pode ser definida, caso contrário a porta padrão do protocolo de comunicação é usada (no caso do protocolo HTTP essa porta padrão é a 80). O cliente usa o IP e a porta para estabelecer uma conexão TCP, e enfim chegamos ao *Caminho* da requisição, que é tudo que ficou *depois* do FQDN e da opcional porta. No caso acima, esse caminho é `/clientes?nome=Maria`.

* **Cabeçalhos (Headers):** são atributos da requisição que podem ser usados para diversos fins, como formatos aceitos, autorização/autenticação, idiomas suportados, etc. Os *cookies*, por exemplo, nada mais são que um *header* especialmente processado pelos servidores e navegadores, para dar a impressão de estado persistente entre várias conexões.

* **Corpo:** dependendo do método da requisição, um *corpo* pode ser enviado junto com ela. Esse corpo pode ser o conteúdo de um formulário preenchido pelo usuário, um arquivo selecionado para *upload*, um objeto no formato JSON, dentre outras coisas.

Durante o processamento da requisição HTTP, o servidor produz uma *resposta*, assim composta:

* **Status Code:** um valor numérico que indica de maneira geral o resultado daquela requisição. Dividida em 6 principais grupos, de acordo com a *centena* do código: 1xx (informativo), 2xx (sucesso), 3xx (redirecionamento), 4xx (erro do cliente), 5xx (erro no servidor). Alguns exemplos clássicos: 404 (página não encontrada), 403 (não autorizado), 301 (redirecionamento permanente), 200 (sucesso).

¹ Atualmente existem outras formas de se efetuar essa comunicação, como WebSockets, mas para fins de simplificar a revisão essas outras tecnologias foram desconsideradas.

* **Cabeçalhos:** a resposta também contém cabeçalhos, assim como a requisição. Um exemplo é o cabeçalho `Content-Type`, que descreve o formato do corpo da resposta.

* **Corpo:** quando aplicável, uma resposta pode conter um corpo, seja ele uma imagem, uma página HTML, um objeto JSON, um PDF para download, ou qualquer outra coisa.

## Front-end (lado do cliente)

É possível observar que ao desenvolver uma aplicação web, é necessário se preocupar com pelo menos dois componentes: o navegador, responsável pela interação com o usuário, e o servidor, responsável por processas as requisições.

Como funciona então o desenvolvimento no lado do cliente? Não é regra, mas normalmente se espera o uso de um *navegador web* (Chrome, Firefox, Edge, Safari, etc.). Esses navegadores estão preparados para mostrar páginas HTML, que por sua vez podem depender de folhas de estilo CSS e código JavaScript.

## JavaScript no navegador web

Originalmente, a linguagem JavaScript foi concebida com o intuito de permitir a implementação de dinamizações simples nas páginas web, como validações em campos de formulário, estilização dinâmica, etc. Não se pensava no uso do JavaScript como principal linguagem em uma aplicação (como é comum hoje em dia), muito menos no uso dele como linguagem no lado servidor (como essa disciplina inteira propõe e defende).

Note que o fato de usar JavaScript no servidor, através de uma ferramenta como o Node.js, não muda em nada o fato de existirem requisições HTTP no meio do caminho. Uma boa regra pra se ter em mente é: para o código JavaScript que está sendo executado no navegador/cliente, é impossível discernir se o servidor está sendo desenvolvido em JavaScript, Java, Python ou qualquer outra linguagem. O navegador e o servidor conversam entre si usando HTTP, o Node.js não muda isso (e nem tem essa intenção).

## Back-end (lado do servidor)

Composto por um *servidor web*, capaz de aceitar as requisições HTTP, e normalmente por um *framework web*, responsável por facilitar o desenvolvimento do software que entende as requisições e gera as respostas apropriadas, conversando com quaisquer fontes de dados (ex: banco de dados relacional) ou serviços externos (ex: API para envio de email) necessários para isso. É aqui que entra o Node.js e todo o seu ecossistema.

## Modelo de execução do JavaScript

Os navegadores executam JavaScript de modo Single Thread e seguindo uma arquitetura baseada em eventos. Mas o que exatamente isso significa?

TODO:

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
