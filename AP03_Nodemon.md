# Nodemon

Desenvolvimento de software é um processo iterativo, onde frequentemente o desenvolvedor faz edições rápidas, reinicializa o executável e analisa o comportamento da aplicação.

Uma técnica muito comum em diversas stacks de desenvolvimento é o uso de um utilitário que monitora os arquivos do projeto, reinicializando (ou efetuando processo equivalente) automaticamente assim que identifica que algo foi modificado.

No caso do Node uma das ferramentas mais conhecidas para este fim é a `Nodemon` [1]. Seu uso é simples, basta instalá-la:

```
npm install -g nodemon
```

E utilizá-la para executar sua aplicação, ao invés de usar o comando `node`. Exemplo:

```
nodemon index.js
```

[1] https://github.com/remy/nodemon
