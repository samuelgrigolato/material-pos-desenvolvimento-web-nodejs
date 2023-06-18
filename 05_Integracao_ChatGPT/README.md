# Finalizando a API

Nesta seção iremos finalizar a API de tarefas adicionando endpoints para anexos, subitems além de refatorar com a inclusão de autenticação via JWT, pooling de conexões e preparar nossa base para escrita de testes automatizados.

## Anexos

Uma das funcionalidades previstas na API de tarefas é a possibilidade de anexar de arquivos em cada tarefa individual. Para desenvolver este recurso no endpoint é necessário primeiro entender como funciona o upload de arquivos no protocolo HTTP.

Lembre-se que o corpo de uma requisição HTTP tem sempre um tipo, no caso nós estamos usando sempre `application/json`. JSON é um formato textual, portanto não é o melhor candidato para transferência de arquivos. Caso os arquivos do usuário sejam realmente bem pequenos existe a possibilidade de converter o conteúdo binário em *base 64*, o que aumenta em mais ou menos 1/4 o tamanho total mas permite que a informação seja passada como um atributo JSON, simplificando o desenvolvimento. Note que tanto do lado do JavaScript no navegador quanto do lado do Node.js a string sempre estará completamente na memória, portanto é uma péssima ideia para arquivos de tamanho médio e grande.

Uma outra opção é usar o tipo de corpo de requisição `multipart/form-data`, que quebra o corpo em partes e é capaz de enviar partes binárias. É nesse caminho que seguiremos.

Começando pela parte do navegador, crie um arquivo `index.html` em uma nova pasta, com o seguinte conteúdo:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta http-equiv='X-UA-Compatible' content='IE=edge'>
  <title>Upload de anexo</title>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <script>

    function enviar() {
      const input = document.getElementById("arquivo");
      const arquivo = input.files[0];

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:8080/tarefas/50/anexos');
      xhr.addEventListener("progress", (e) => {
        console.log('progress', e);
      });
      xhr.addEventListener("load", (e) => {
        console.log('load', e);
      });
      xhr.send(arquivo);

    }

  </script>
</head>
<body>
  <input type="file" id="arquivo">
  <button onclick="enviar()">Enviar</button>
</body>
</html>
```

Para conseguir testar esse código antes de desenvolver o endpoint vamos utilizar dois utilitários: o `http-server`, já conhecido, para expor o `index.html` no navegador e o `http-echo-server`, que ficará responsável por `ecoar` qualquer tipo de requisição HTTP que receber. Comece subindo o `http-server` na mesma pasta onde criou o `index.html`:

```
$ npx http-server -P http://localhost:3000 --cors
```

E o `http-echo-server` (este comando deve ser executado em um outro terminal e não importa a pasta):

```
$ npx http-echo-server
```

Abra agora a página `http://localhost:8080`, deixe o console de desenvolvedor (F12) aberto na aba de rede, selecione um arquivo e clique em *Enviar*. Pontos importantes:

- Header de requisição `Content-Length` indica o tamanho em bytes do arquivo;
- Header de requisição `Content-Type` é o tipo do arquivo selecionado de acordo com o entendimento do navegador.

Mas e se quisermos enviar mais informações do arquivo? Nem sempre só o conteúdo binário é o suficiente. Uma alternativa é o uso de cabeçalhos customizados, mas essa solução é um pouco estranha. A melhor opção é a transformação do código que monta o objeto `XMLHttpRequest` para enviar os valores usando uma instância de `FormData`:

```js
function enviar() {
  const input = document.getElementById("arquivo");
  const arquivo = input.files[0];

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8080/tarefas/50/anexos');
  xhr.addEventListener("progress", (e) => {
    console.log('progress', e);
  });
  xhr.addEventListener("load", (e) => {
    console.log('load', e);
  });
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  formData.append('teste', 123);
  xhr.send(formData);
}
```

Repita o processo e note que agora o conteúdo da requisição tem 2 partes e cada uma possui mais informações com metadados úteis, dentre eles o nome e tipo do arquivo. Curiosidade: a especificação do multipart/form-data deixa a entender que o agente que está enviando a mensagem precisa garantir que a geração do token de fronteira (boundary) gere um token que não faz parte do conteúdo do arquivo, e isso significa basicamente uma leitura completa das partes antes de iniciar o envio da requisição! Veja: https://datatracker.ietf.org/doc/html/rfc2046#section-5.1.

> This implies that it is crucial that the composing agent be able to choose and specify a unique boundary parameter value that does not contain the boundary parameter value of an enclosing multipart as a prefix.

Segundo uma outra especificação, essa escolha pode ser "probabilística": https://datatracker.ietf.org/doc/html/rfc1867#section-3.3.

> A boundary is selected that does not occur in any of the data. (This selection is sometimes done probabilisticly.)

Note que é possível simular essa exata requisição usando Insomnia/Postman/curl ou qualquer outra ferramenta. Daqui para a frente vamos utilizar este meio para simplificar. Curiosidade: veja como o Insomnia falha na escolha de um boundary.

Agora que finalizamos a parte do front end, é a hora de fechar o `http-echo-server` e implementar o processamento do upload por dentro do Express! O primeiro passo é instalar o Middleware `express-fileupload`:

```sh
$ npm install express-fileupload
```

Vá até o `app.js` e instale o Middleware:

```js
//..
import fileUpload from 'express-fileupload';
//..
app.use(express.json());
app.use(fileUpload({
  debug: true,
  //useTempFiles: false,
  //abortOnLimit: false,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50mb
  }
}));

app.use((req, _res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType !== undefined &&
      !contentType.startsWith('application/json') &&
      !contentType.startsWith('multipart/form-data')) {
    next({
      statusCode: 400,
      message: 'Corpo da requisição deve ser application/json ou multipart/form-data'
    });
  } else {
    next();
  }
});
//..
```

Com isso os uploads ficam disponíveis no atributo `req.files`. Adicione o endpoint novo no arquivo `tarefas/router.js` e verifique:

```js
router.post('/:id/anexos', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  console.log(req.files);
  res.json({ id: 1 });
}));
```

Repare que `files` é um objeto cujas chaves são os nomes dos arquivos encontrados na requisição, e o valor de cada arquivo é um outro objeto com seu nome, tamanho em bytes, mimetype e uma função bem útil chamada `mv`, que permite mover o arquivo para um local no sistema de arquivos. O último passo desse cadastro de anexo é movermos o arquivo para um local persistente e criar um registro no banco de dados que vincula este arquivo com a tarefa. É bem interessante armazenarmos como metadados do upload o seu tamanho, nome e mimetype, informações cruciais para uma boa experiência de download posteriormente. O primeiro passo é escrever uma nova migração de banco de dados criando a tabela de anexos:

```sh
$ npx knex --esm migrate:make cria_tabela_anexos
```

E seu conteúdo:

```js
export async function up (knex) {
  await knex.schema.createTable('anexos', function (table) {
    table.increments();
    table.text('nome').notNullable();
    table.integer('tamanho').notNullable();
    table.text('mime_type').notNullable();
    table.integer('id_tarefa').references('tarefas.id');
  });
}

export async function down () {
  throw new Error('não suportado');
}
```

Não esqueça de rodar a migration criada:

```sh
$ npx knex --esm migrate:latest
```

Agora que a tabela existe é possível implementar o método que insere o registro de anexo vinculado com a tarefa no arquivo `tarefas/model.js`:

```js
export async function cadastrarAnexo (idTarefa, nome, tamanho, mimeType, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const res = await knex('anexos')
    .transacting(uow)
    .insert({
      id_tarefa: idTarefa,
      nome,
      tamanho,
      mime_type: mimeType
    })
    .returning('id');
  return res[0];
}
```

E por fim terminar a implementação na camada de endpoint (repare que o ID gerado é usado como nome do destino final do upload, quais as repercussões disso em termos de atomicidade da operação?):

```js
router.post('/:id/anexos', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const arquivo = req.files.arquivo;
  const idAnexo = await cadastrarAnexo(
    req.params.id,
    arquivo.name,
    arquivo.size,
    arquivo.mimetype,
    req.loginDoUsuario,
    req.uow
  );
  await arquivo.mv(`uploads/${idAnexo}`);
  res.json({ id: idAnexo });
}));
```

Antes de testar crie uma pasta chamada `uploads` no diretório do projeto. Coloque-a no arquivo `.gitignore`.

Proposta de exercício: implemente o endpoint para excluir anexos, ele deve responder no seguinte caminho: `DELETE /tarefas/:id_tarefa/anexos/:id_anexo`. Evite que a operação funcione se o identificador da tarefa não for o identificador correto para este anexo.

O primeiro passo é adicionar o método no arquivo `tarefas/model.js`:

```js
export async function excluirAnexo (idTarefa, idAnexo, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  await assegurarExistenciaEDescendenciaDoAnexo(idTarefa, idAnexo, uow);
  await knex('anexos')
    .transacting(uow)
    .where('id', idAnexo)
    .delete();
}

async function assegurarExistenciaEDescendenciaDoAnexo (idTarefa, idAnexo, uow) {
  const res = await knex('anexos')
    .transacting(uow)
    .select('id_tarefa')
    .where('id', idAnexo);
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('AnexoNaoEncontrado', 'Anexo não encontrado.');
  }
  const anexo = res[0];
  if (anexo.id_tarefa !== idTarefa) {
    throw new DadosOuEstadoInvalido('AnexoNaoEncontrado', 'Anexo não encontrado.');
  }
}
```

E por fim expor o endpoint no arquivo `tarefas/router.js`:

```js
router.delete('/:id/anexos/:idAnexo', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const idAnexo = parseInt(req.params.idAnexo);
  await excluirAnexo(
    parseInt(req.params.id),
    idAnexo,
    req.loginDoUsuario,
    req.uow
  );
  await fs.rm(`uploads/${idAnexo}`); // MUITO cuidado com essa linha, ela só é segura aqui pois estamos usando parseInt
  res.sendStatus(204);
}));
```

E o download? O ponto de atenção aqui é perceber que existe um método chamado `download` no objeto da resposta que aceita um caminho de arquivo. Veja:

```js
router.get('/:id/anexos/:idAnexo', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await new Promise((resolve, reject) => {
    res.download(`uploads/${parseInt(req.params.idAnexo)}`, 'teste.png', err => {
      if (err) reject(err);
      else resolve();
    });
  });
}));
```

Vamos começar criando um utilitário `asyncDownload`, em um novo arquivo `async-download.js`:

```js
export default (path, filename, res) => {
  return new Promise((resolve, reject) => {
    res.download(path, filename, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
```

Crie agora um método `consultarNomeDoAnexo` no arquivo `tarefas/model.js`. Este método também vai garantir que o usuário tem acesso a este anexo:

```js
export async function consultarNomeDoAnexo (idTarefa, idAnexo, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  await assegurarExistenciaEDescendenciaDoAnexo(idTarefa, idAnexo, uow);
  const res = await knex('anexos')
    .select('nome')
    .where('id', idAnexo);
  return res[0].nome;
}
```

Adapte por fim o router para utilizar os novos métodos:

```js
router.get('/:id/anexos/:idAnexo', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const idAnexo = parseInt(req.params.idAnexo);
  const filename = await consultarNomeDoAnexo(parseInt(req.params.id), idAnexo, req.loginDoUsuario, req.uow);
  await asyncDownload(`uploads/${idAnexo}`, filename, res);
}));
```

Como implementar este download no front end? Lembre-se do Bearer token de autenticação. Uma boa discussão de alternativas pode ser visualizada aqui: https://stackoverflow.com/questions/29452031/how-to-handle-file-downloads-with-jwt-based-authentication. Como os arquivos aqui devem ser pequenos, a solução de fetch com createObjectUrl parece apropriada e suficiente.

Proposta de exercício: adaptar o endpoint GET /tarefas retornando nele também a lista de anexos. Quais valores é interessante expor para permitir que o front end mostre a lista conforme desenhada?

Para implementar esta alteração basta adaptar a função `consultarTarefas` no arquivo `tarefas/model.js`:

```js
export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  let query = knex('tarefas')
//...
    });
  }

  const resAnexos = await knex('anexos')
    .select('id_tarefa', 'id', 'nome', 'tamanho', 'mime_type')
    .whereIn('id_tarefa', idsTarefa);
  const mapaAnexos = {};
  for (const vinculo of resAnexos) {
    const idTarefa = vinculo.id_tarefa;
    if (mapaAnexos[idTarefa] === undefined) {
      mapaAnexos[idTarefa] = [];
    }
    mapaAnexos[idTarefa].push({
      id: vinculo.id,
      nome: vinculo.nome,
      tamanho: vinculo.tamanho,
      mime_type: vinculo.mime_type
    });
  }

  return res.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.data_conclusao,
    etiquetas: mapaEtiquetas[x.id] || [],
    anexos: mapaAnexos[x.id] || []
  }));
}
```

## Autenticação usando Json Web Token

Pare um momento para refletir sobre o sistema de autenticação desenvolvido para a nossa API. O fato de exigir uma consulta no banco de dados a cada checagem de permissão dificulta um pouco a escala desse processo, além de exigir que qualquer sistema que precise autenticar o usuário com base no token acabe acessando o banco de dados de uma forma ou de outra eventualmente. Esses atributos tornam a solução inadequada para determinados tipos de APIs.

Mas como resolver? Parece intuitivo que seja necessária uma base de tokens e que o backend tenha que consultá-la para ter certeza de que o usuário é quem diz ser, certo? Por mais que seja intuitivo, essa premissa é falsa, como vamos ver.

Imagine que você pudesse escrever algo em um papel, entregar para alguém desconhecido, recebê-lo futuramente e ter absoluta certeza que ele não foi alterado e que as informações ali foram realmente escritas por você no passado. Isso é possível hoje no mundo digital através de assinaturas digitais, que por baixo usam algum mecanismo baseado em chave única/criptografia simétrica ou par de chaves/criptografia assimétrica.

No mundo das assinaturas com chave única (simétrica) temos como um bom exemplo o HMAC sobre SHA-256: https://www.devglan.com/online-tools/hmac-sha256-online. E no mundo das assimétricas nós temos por exemplo a RSA: https://www.devglan.com/online-tools/rsa-encryption-decryption.

Pense agora na seguinte solução: o usuário te convence de que é ele mesmo no endpoint/serviço de autenticação, via qualquer meio que você julgar suficiente: login/senha, rede social, biometria, certificado digital etc. Você devolve um texto que o identifica (por exemplo o ID do usuário na base de dados do sistema) junto uma data de expiração e uma *assinatura digital* usando HMAC SHA-256, RSA ou similar. No futuro, sempre que este usuário quiser executar alguma ação, basta ele enviar este *token* (que é seu ID mais a assinatura digital) e qualquer sistema seu que possua a chave capaz de validar a assinatura pode autenticá-lo sem a necessidade de acesso à base de dados de tokens.

Mas onde entra o JWT? É só um padrão de envio dessas informações permitindo que várias bibliotecas em várias linguagens e plataformas possam falar a mesma língua, facilitando muito a troca de tokens entre sistemas. A melhor forma de entender seu funcionamento é explorar através da ferramenta https://jwt.io: basta adicionar chaves no cabeçalho, corpo, preencher uma chave simétrica ou inserir uma chave pública RSA no campo apropriado e ver a mágica acontecer.

Com esse conhecimento somos agora capazes de desenhar uma refatoração na nossa API de modo a deixar de usar a tabela de autenticações no banco de dados e passar a usar JWT no lugar para autenticar os usuários. Esse processo possui as seguintes etapas:

1. Adaptar o método `autenticar` no arquivo `usuarios/model.js` para retornar um JWT ao invés de inserir um registro na tabela de autenticações;
2. Adaptar o método `recuperarLoginDoUsuarioAutenticado` no arquivo `usuarios/model.js` para validar o JWT recebido;
3. Criar uma migração para remover a tabela de autenticações.

Reflexão: leia novamente esses passos, principalmente o 3, e imagine que sua API já está sendo utilizada por usuários e não pode parar. Como fazer para evitar a interrupção durante o processo de refatoração do mecanismo de autenticação?

Vamos começar a implementação escolhendo uma biblioteca Node.js para gerar e validar o token. No próprio https://jwt.io é possível encontrar sugestões. Vamos usar a `jsonwebtoken` da Auth0.

Leitura interessante sobre uma falha de segurança que era bem comum nos primeiros dias do JWT: https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries.

Comece instalando a biblioteca:

```sh
$ npm install jsonwebtoken
```

Agora adapte a função `autenticar` no arquivo `usuarios/model.js`:

```js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { AutenticacaoInvalida, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import knex from '../querybuilder.js';


const JWT_SECRET = process.env.JWT_SECRET;
if (JWT_SECRET === undefined || JWT_SECRET === '') {
  throw new Error('Env JWT_SECRET não definida.');
}


export async function autenticar (login, senha) {
  const res = await knex('usuarios')
    .where('login', login)
    .select('id', 'senha');
  if (res.lenght === 0) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const usuario = res[0];
  if (!bcrypt.compareSync(senha, usuario.senha)) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 24 * 60 * 60 /* 10 dias */
  }, JWT_SECRET);
}
//...
```

Adapte agora o método `recuperarLoginDoUsuarioAutenticado`, considerando que o parâmetro `autenticacao` agora carrega um JWT ao invés de um GUID:

```js
export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  let tokenVerificado;
  try {
    tokenVerificado = jwt.verify(autenticacao, JWT_SECRET);
  } catch (err) {
    if (err.message !== 'invalid signature') {
      console.warn(err);
    }
    throw new AutenticacaoInvalida();
  }
  return tokenVerificado['login'];
}
```

Proposta de exercício: mude o tempo de validade do token JWT para poucos segundos e verifique o que acontece quando você tenta utilizá-lo. Silencie o ruído nos logs da mesma forma que ocorre com a assinatura inválida.

A primeira parte é simples:

```js
exp: Math.floor(new Date().getTime() / 1000) + 10 /* 10 segundos */
```

E o silenciamento do ruído no console:

```js
} catch (err) {
  if (err.message !== 'invalid signature' && err.message !== 'jwt expired') {
    console.warn(err);
  }
  throw new AutenticacaoInvalida();
}
```

## Pooling de conexão

Recapture na memória (ou no seu sistema de arquivos) a implementação de acesso a banco de dados que utilizou conexão direta usando `pg`. Cada requisição criava e fechada sua própria conexão com o banco de dados. Note que com `knex` não fica claro exatamente como isso ocorre, e de fato o comportamento é diferente. Como a criação e fechamento de conexões com banco de dados é um processo custoso e relativamente lento, é uma boa ideia manter um *conjunto* (pool) de conexões sempre abertas e reutilizá-las para atender as requisições. Por padrão o `knex` usa um gestor de pool chamado `tarn` com configuração de 2 no mínimo e 10 conexões no máximo abertas simultâneamente. Detalhes: https://knexjs.org/#Installation-pooling.

## Testes automatizados

Hoje em dia não se considera mais como boa prática a manutenção/desenvolvimento de bases de código sem a escrita de testes automatizados. Os benefícios trazidos por uma boa cobertura são muito grandes, desde o valor de documentação providenciado pelo código de teste até o aumento na confiança nas implantações.

Mas como funciona o desenvolvimento de automação de testes? Isso depende muito do tipo de teste e da plataforma de desenvolvimento utilizada. Nesta disciplina exploraremos o desenvolvimento de testes unitários e de integração, mas também existem outros como o teste de aceitação.

Existem três grandes frameworks de teste para JavaScript: Mocha, Jest e Jasmine. Aqui utilizaremos o Jest, mas a estrutura é parecida nos três. Ele pode ser instalado via npm:

```sh
$ npm install --save-dev jest
```

Antes de partir para o desenvolvimento de testes para a API de tarefas, vamos começar com um exemplo mais simples: uma função que calcula o enésimo número de fibonacci. Crie um arquivo chamado `fib.js` com o seguinte conteúdo:

```js
export default () => 0;
```

E agora um outro arquivo chamado `fib.test.js`:

```js
import fib from './fib';

describe('fib', () => {
  it ('deve retornar 1 para n=1', () => {
    expect(fib(1)).toBe(1);
  })
});

export default {};
```

Para executar utilize o seguinte comando:

```sh
NODE_OPTIONS=--experimental-vm-modules npx jest
```

Uma boa dica é sempre alterar o código do jeito mais simples possível para fazer os testes existentes passarem. Neste caso basta alterar o retorno para 1. Obviamente ainda não temos uma função capaz de gerar os números de fibonacci, então vamos adicionar mais alguns testes:

```js
describe('fib', () => {
  it ('deve retornar 1 para n=1', () => {
    expect(fib(1)).toBe(1);
  });

  it ('deve retornar 1 para n=2', () => {
    expect(fib(2)).toBe(1);
  });

  it ('deve retornar 2 para n=3', () => {
    expect(fib(3)).toBe(2);
  });

  it ('deve retornar 3 para n=4', () => {
    expect(fib(4)).toBe(3);
  });

  it ('deve retornar 5 para n=5', () => {
    expect(fib(5)).toBe(5);
  });

  it ('deve retornar 8 para n=6', () => {
    expect(fib(6)).toBe(8);
  });
});
```

E implementar a solução final:

```js
export default (n) => {
  let anterior = 0;
  let res = 1;
  let i = 1;
  while (i < n) {
    const aux = anterior;
    anterior = res;
    res = res + aux;
    i++;
  }
  return res;
};
```

Proposta de exercício: refatore a solução de modo que ela use recursão. Note que não deve ser necessário alterar nada no arquivo de teste, e ele ajudará a garantir que não houve regressão.

```js
function fib (n) {
  if (n <= 0) return 0;
  if (n <= 2) return 1;
  return fib(n - 1) + fib(n - 2);
}

export default fib;
```

Agora que sabemos como é a estrutura de um teste automatizado podemos aplicá-lo na API de tarefas. O primeiro passo é decidir onde será o "corte", ou seja, qual interface iremos tratar como sujeito do teste? Essa escolha é importante e decide a abrangência do teste. No nosso caso temos dois candidatos para pontos de corte, e implementaremos o mesmo exemplo nos dois lugares. São eles:

1. No arquivo de modelo;
2. Interagindo direto com o `app` Express.

Quanto mais "alto" o ponto de corte, ou seja, quanto mais próximo da chamada HTTP, mais abrangente é o teste. Porém, além de abrangente o teste costuma ser mais complicado de escrever e viabilizar.

Vamos começar pelo teste no arquivo de modelo. Faremos no método que permite cadastrar uma etiqueta em uma tarefa, e trataremos os cenários onde a etiqueta já existe e não existe previamente. Veja a assinatura do método, para relembrar:

```js
export async function vincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
```

Note que este método (e praticamente todos os outros) vai efetuar muitos acessos na base de dados. Poderíamos "simular" uma base de dados, o que de fato vamos fazer em outro momento, mas nesse caso queremos utilizar uma base de dados real, para aumentar nossa confiança de que não escreveremos migrações de banco de dados que sem querer quebram partes da nossa API. Para atingir este objetivo temos duas coisas a fazer:

1. Adaptar o arquivo `querybuilder.js` e o `knexfile.js` para olhar as variáveis de ambiente na hora de definir a string de conexão com o banco de dados;
2. Escrever um script utilitário para rodar os testes que, antes de rodá-los, executa as migrações.

Para o primeiro passo, ajuste o arquivo `querybuilder.js` dessa forma:

```js
const knex = knexLib({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  debug: true
});
```

E, similarmente, o `knexfile.js`:

```js
export const development = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  migrations: {
    tableName: 'knex_migrations'
  }
};
```

Crie agora um arquivo `rodar_testes.sh`:

```sh
#!/bin/bash

set -e

export DATABASE_URL='postgres://postgres:postgres@localhost:5432/testes'
npx knex --esm migrate:latest
NODE_OPTIONS=--experimental-vm-modules npx jest
```

Crie o banco de dados `testes` no PostgreSQL.

Dê permissão de execução para este arquivo e execute-o:

```sh
$ chmod +x rodar_testes.sh
$ ./rodar_testes.sh
```

Agora que temos o banco de dados "limpo" disponível nos testes, crie um arquivo chamado `tarefas/model.test.js` com o seguinte conteúdo:

```js
describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', async () => {
    let trx = await db.transaction();
    try {
      let res = await trx('usuarios')
        .insert({
          login: 'fulano',
          nome: 'Fulano',
          senha: '???'
        })
        .returning('id');
      const idUsuario = res[0];
      res = await trx('categorias')
        .insert({ descricao: 'Pessoal' })
        .returning('id');
      const idCategoria = res[0];
      res = await trx('tarefas')
        .insert({
          descricao: 'Tarefa X',
          id_usuario: idUsuario,
          id_categoria: idCategoria
        })
        .returning('id');
      const idTarefa = res[0];
      await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
      res = await trx('etiquetas')
        .select(['id', 'descricao']);
      expect(res.length).toBe(1);
      expect(res[0].descricao).toBe('youtube');
      const idEtiqueta = res[0].id;
      res = await trx('tarefa_etiqueta')
        .select(['id_tarefa', 'id_etiqueta']);
      expect(res.length).toBe(1);
      expect(res[0].id_tarefa).toBe(idTarefa);
      expect(res[0].id_etiqueta).toBe(idEtiqueta);
    } finally {
      await trx.rollback();
    }
  });
});
```

Antes de refatorarmos este código, note que o jest não encerra de fato. Isso ocorre pois o knex ainda está com suas conexões abertas. Para encerrá-lo crie um arquivo chamado `jest.config.js` com o seguinte conteúdo:

```js
export default {
  setupFilesAfterEnv: [
    './setupTest.js'
  ]
};
```

Agora crie o arquivo `setupTest.js`:

```js
import db from './querybuilder';

afterAll(async () => {
  await db.destroy();
});
```

Antes de continuar podemos implementar algumas refatorações no código de teste. A primeira delas é a criação de um utilizário `comTransacaoDeTeste` que encapsula a criação da transação e seu rollback. Crie um arquivo `testes/transacao-de-teste.js`:

```js
import db from '../querybuilder';

export default (callback) => {
  return async () => {
    let trx = await db.transaction();
    try {
      await callback(trx);
    } finally {
      await trx.rollback();
    }
  }
};
```

E use-o no arquivo `model.test.js`:

```js
it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
  let res = await trx('usuarios')
    .insert({
      login: 'fulano',
      nome: 'Fulano',
      senha: '???'
    })
    .returning('id');
  //...
  res = await trx('tarefa_etiqueta')
    .select(['id_tarefa', 'id_etiqueta']);
  expect(res.length).toBe(1);
  expect(res[0].id_tarefa).toBe(idTarefa);
  expect(res[0].id_etiqueta).toBe(idEtiqueta);
}));
```

A próxima refatoração é extrair a criação dos registros para funções reutilizáveis. Essas funções são comumente chamadas de "fábricas". Crie um arquivo `testes/fabrica.js` com o seguinte conteúdo:

```js
export async function fabricarCategoria (trx) {
  const res = await trx('categorias')
    .insert({ descricao: 'Categoria Teste' })
    .returning('id');
  return res[0];
}

export async function fabricarUsuario (trx, { login } = {}) {
  const res = await trx('usuarios')
    .insert({
      nome: 'Usuário Teste',
      login: login || 'usuario',
      senha: '123456'
    })
    .returning('id');
  return res[0];
}

export async function fabricarTarefa (trx, { id_usuario, id_categoria }) {
  const res = await trx('tarefas')
    .insert({
      descricao: 'Tarefa Teste',
      id_usuario,
      id_categoria
    })
    .returning('id');
  return res[0];
}
```

E use esses métodos no `model.test.js`:

```js
import comTransacaoDeTeste from '../testes/transacao-de-teste';
import { fabricarCategoria, fabricarTarefa, fabricarUsuario } from '../testes/fabrica';
import { vincularEtiqueta } from './model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idCategoria = await fabricarCategoria(trx);
    const idTarefa = await fabricarTarefa(trx, { id_usuario: idUsuario, id_categoria: idCategoria });
    await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
    res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
```

Node que idCategoria serve apenas para criar a tarefa, então faz sentido mover esta criação para dentro do método `fabricarTarefa`:

```js
export async function fabricarTarefa (trx, { idUsuario, idCategoria }) {
  const res = await trx('tarefas')
    .insert({
      descricao: 'Tarefa Teste',
      id_usuario: idUsuario,
      id_categoria: idCategoria || await fabricarCategoria(trx)
    })
    .returning('id');
  return res[0];
}
```

E adaptar mais uma vez o `model.test.js`:

```js
import comTransacaoDeTeste from '../testes/transacao-de-teste';
import { fabricarTarefa, fabricarUsuario } from '../testes/fabrica';
import { vincularEtiqueta } from './model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
    let res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
```

Proposta de exercício: crie um caso de teste que garante que o vínculo de uma etiqueta existente funciona sem quebrar a aplicação.

Comece criando uma fábrica para etiquetas no arquivo `testes/fabrica.js`:

```js
export async function fabricarEtiqueta (trx, { descricao, cor } = {}) {
  const res = await trx('etiquetas')
    .insert({
      descricao: descricao || 'Etiqueta Teste',
      cor: cor || 'white'
    })
    .returning('id');
  return res[0];
}
```

E depois adicione um novo bloco `it` no arquivo `model.test.js`:

```js
it('deve funcionar se a etiqueta já existir', comTransacaoDeTeste(async (trx) => {
  const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
  const idTarefa = await fabricarTarefa(trx, { idUsuario });
  const idEtiqueta = await fabricarEtiqueta(trx, { descricao: 'youtube' });
  await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
  const res = await trx('tarefa_etiqueta')
    .select(['id_tarefa', 'id_etiqueta']);
  expect(res.length).toBe(1);
  expect(res[0].id_tarefa).toBe(idTarefa);
  expect(res[0].id_etiqueta).toBe(idEtiqueta);
}));
```

Agora vamos subir um nível e implementar esses mesmos testes conversando direto com o Express. Para isso utilizaremos uma biblioteca chamada `supertest`. Instale-a:

```sh
$ npm i supertest
```

Possivelmente agora você irá se lembrar que a unidade de trabalho é um Middleware no Express. De alguma forma teremos que interceptá-lo para injetar a transação de teste, e isso será feito da seguinte forma:

1. Extrair o código que adiciona os middlewares e routers na instância de app em um arquivo `setup-app.js`;
2. Chamar esse método no arquivo `app.js`;
3. Criar um utilitário `testes/app-de-teste.js` que monta uma instância de app adicionando um middleware que expõe uma transação de teste;
4. Adaptar o hook `comUnidadeDeTrabalho` para não sobrescrever `req.uow` caso já exista.

Primeiro passo, crie o arquivo `setup-app.js` e mova uma parte do conteúdo que está em `app.js`:

```js
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';

import asyncWrapper from './async-wrapper.js';
import { recuperarLoginDoUsuarioAutenticado } from './usuarios/model.js';
import usuariosRouter from './usuarios/router.js';
import tarefasRouter from './tarefas/router.js';
import etiquetasRouter from './etiquetas/router.js';
import categoriasRouter from './categorias/router.js';

export default app => {
  app.use(cors());
  app.use(express.json());
  app.use(fileUpload({
    debug: true,
    //useTempFiles: false,
    //abortOnLimit: false,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50mb
    }
  }));
  
  app.use((req, _res, next) => {
    const contentType = req.headers['content-type'];
    if (contentType !== undefined &&
        !contentType.startsWith('application/json') &&
        !contentType.startsWith('multipart/form-data')) {
      next({
        statusCode: 400,
        message: 'Corpo da requisição deve ser application/json ou multipart/form-data'
      });
    } else {
      next();
    }
  });
  
  app.use(asyncWrapper(async (req, _res, next) => {
    const authorization = req.headers['authorization'];
    const match = /^Bearer (.*)$/.exec(authorization);
    if (match) {
      const autenticacao = match[1];
      const loginDoUsuario = await recuperarLoginDoUsuarioAutenticado(autenticacao);
      req.loginDoUsuario = loginDoUsuario;
    }
    next();
  }));
  
  app.use('/tarefas', tarefasRouter);
  app.use('/usuarios', usuariosRouter);
  app.use('/etiquetas', etiquetasRouter);
  app.use('/categorias', categoriasRouter);
  
  app.use((_req, res) => {
    res.status(404).send({
      razao: 'Rota não existe.'
    });
  });
  
  app.use((err, _req, res, _next) => {
    let resposta;
    if (err.codigo) {
      resposta = {
        codigo: err.codigo,
        descricao: err.message,
        extra: err.extra
      };
    } else {
      resposta = {
        razao: err.message || err
      };
    }
    res.status(err.statusCode || 500).send(resposta);
  });
};
```

E adapte o `app.js` dessa maneira:

```js
import express from 'express';
import setupApp from './setup-app.js';

const app = express();
setupApp(app);
app.listen(8080);
```

Agora crie o arquivo `testes/app-de-teste.js`:

```js
import express from 'express';
import comTransacaoDeTeste from './transacao-de-teste';
import setupApp from '../setup-app';

export default (callback) => {
  return comTransacaoDeTeste(async (trx) => {
    const appDeTeste = express();
    appDeTeste.use(function (req, _res, next) {
      req.uow = trx;
      next();
    });
    setupApp(appDeTeste);
    await callback(appDeTeste, trx);
  });
};
```

E adapte o método `comUnidadeDeTrabalho` no arquivo `querybuilder.js`:

```js
export function comUnidadeDeTrabalho () {
  return function (req, res, next) {
    if (req.uow) { // esse if foi adicionado
      next();
      return;
    }
    knex.transaction(function (trx) {
      res.on('finish', function () {
        if (res.statusCode < 200 || res.statusCode > 299) {
          trx.rollback();
        } else {
          trx.commit();
        }
      });
      req.uow = trx;
      next();
    });
  }
}
```

Com o supertest e essa preparação agora é possível escrever testes nesse nível. Crie um arquivo chamado `tarefas/router.test.js` com o seguinte conteúdo:

```js
import request from 'supertest';
import comAppDeTeste from '../testes/app-de-teste';
import { fabricarEtiqueta, fabricarTarefa, fabricarUsuario } from '../testes/fabrica';

import { gerarToken } from '../usuarios/model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comAppDeTeste(async (appDeTeste, trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    await request(appDeTeste)
      .post(`/tarefas/${idTarefa}/etiquetas`)
      .set('Authorization', `Bearer ${gerarToken('fulano')}`)
      .send({ etiqueta: 'youtube' })
      .expect(204);
    let res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));

  it('deve funcionar se a etiqueta já existir', comAppDeTeste(async (appDeTeste, trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    const idEtiqueta = await fabricarEtiqueta(trx, { descricao: 'youtube' });
    await request(appDeTeste)
      .post(`/tarefas/${idTarefa}/etiquetas`)
      .set('Authorization', `Bearer ${gerarToken('fulano')}`)
      .send({ etiqueta: 'youtube' })
      .expect(204);
    const res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
```

Note que uma pequena refatoração no arquivo `usuarios/model.js` foi necessária para expor uma maneira de gerar um token de autenticação dado um login:

```js
export function gerarToken (login) {
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 60 * 60 /* 10 horas */
  }, JWT_SECRET);
}


export async function autenticar (login, senha) {
  const res = await knex('usuarios')
    .where('login', login)
    .select('id', 'senha');
  if (res.lenght === 0) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const usuario = res[0];
  if (!bcrypt.compareSync(senha, usuario.senha)) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  return gerarToken(login);
}
```
