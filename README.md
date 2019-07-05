# Desenvolvimento de APIs usando Node.js

Este repositório contém o material usado na disciplina _Desenvolvimento de APIs usando Node.js_, parte integrante do curso de pós graduação em Desenvolvimento Web oferecido pela UFSCar.

Carga horária: 40 horas.

## Ementa

* Introdução ao Node.js: Apresentação do JavaScript como alternativa de linguagem para desenvolvimento de APIs de dados. Análise da arquitetura baseada em eventos do Node.js, com foco nos benefícios de performance e concorrência trazidos por ela.

* Desenvolvendo APIs de dados com Express: Aprofundamento no framework Express para o desenvolvimento de APIs de dados, buscando cobrir casos excepcionais como recebimento de arquivos (upload) e envio de imagens pré-processadas, além do CRUD básico.

* Trabalhando com dados usando Knex: Adicionar persistência de dados na nossa aplicação através do framework de construção de SQL Knex. Gerenciar a evolução da base de dados através da ferramenta db-migrate.

* Servidores Stateless vs. Stateful: Análise conceitual de servidores stateless e servidores stateful, incluindo o conceito de sticky session. Desenvolvimento de mecanismo de autenticação totalmente stateless.

* Usando cache para aumentar a performance da API: Apresentação do uso de cache em diversas camadas da aplicação e análise dos ganhos de performance obtidos.

## Índice

* [01 - Node.js](01_Nodejs.md)
* [02 - Express](02_Express.md)
* [03 - Knex](03_Knex.md)
* [04 - Stateless vs stateful](04_Stateless_vs_stateful.md)
* [05 - Cache](05_Cache.md)
* [Apêndice 1 - URL ao invés de Querystring](AP01_URL.md)
* [Apêndice 2 - Executando express em modo cluster](AP02_Express_modo_cluster.md)
* [Apêndice 3 - Nodemon](AP03_Nodemon.md)

## Gerando PDF

Instale a ferramenta `md-to-pdf`:

```
npm i -g md-to-pdf
```

Depois execute o seguinte comando:

```
md2pdf <arquivo.md> --launch-options '{ "args": ["--no-sandbox"] }'
```
