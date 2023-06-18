# Anexos

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
