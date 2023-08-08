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

Agora que finalizamos a parte do front end, é a hora de fechar o `http-echo-server` e implementar o processamento do upload por dentro do Fastify! O primeiro passo é instalar o Middleware `fastify-file-upload`:

```sh
$ npm install fastify-file-upload
```

Vá até o `app.ts` e instale o plugin:

```ts
import fileUpload from 'fastify-file-upload';

...

app.register(fileUpload, {
  debug: true,
  limits: { fileSize: 50 * 1024 * 1024 },
});
```

Com isso os uploads ficam disponíveis no atributo `req.raw.files`. Adicione o endpoint novo no arquivo `tarefas/router.ts` e verifique:

```ts
app.post('/:id/anexos', async (req, resp) => {
  console.log((req.raw as any).files); // suporte TypeScript da biblioteca está incompleto
});
```

Repare que `raw.files` é um objeto cujas chaves são os nomes dos arquivos encontrados na requisição, e o valor de cada arquivo é um outro objeto com seu nome, tamanho em bytes, mimetype e uma função bem útil chamada `mv`, que permite mover o arquivo para um local no sistema de arquivos. O último passo desse cadastro de anexo é movermos o arquivo para um local persistente e criar um registro no banco de dados que vincula este arquivo com a tarefa. É bem interessante armazenarmos como metadados do upload o seu tamanho, nome e mimetype, informações cruciais para uma boa experiência de download posteriormente. O primeiro passo é escrever uma nova migração de banco de dados criando a tabela de anexos:

```sh
$ npx knex migrate:make cria_tabela_anexos
```

E seu conteúdo:

```ts
import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('anexos', function (table) {
    table.uuid('id').primary();
    table.text('nome').notNullable();
    table.integer('tamanho').notNullable();
    table.text('mime_type').notNullable();
    table.integer('id_tarefa').references('tarefas.id');
  });
}


export async function down(knex: Knex): Promise<void> {
  throw new Error('não suportado');
}
```

Não esqueça de rodar a migration criada:

```sh
$ npx knex migrate:latest
```

Agora que a tabela existe é possível implementar o método que insere o registro de anexo vinculado com a tarefa no arquivo `tarefas/model.ts`:

```ts
export async function cadastrarAnexo(usuario: Usuario, idTarefa: number, nome: string, tamanho: number, mimeType: string, uow: Knex): Promise<string> {
  asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, idTarefa, uow);
  const id = uuid();
  await uow('anexos')
    .insert({
      id,
      id_tarefa: idTarefa,
      nome,
      tamanho,
      mime_type: mimeType,
    });
  return id;
}
```

E por fim terminar a implementação na camada de endpoint (repare que o ID gerado é usado como nome do destino final do upload, quais as repercussões disso em termos de atomicidade da operação?):

```ts
import { mkdir } from 'fs/promises';

...

app.post('/:id/anexos', async (req, resp) => {
  const { id } = req.params as { id: string };
  const idTarefa = Number(id);
  const arquivo = (req.raw as any).files.arquivo; // suporte TypeScript da biblioteca está incompleto
  const idAnexo = await cadastrarAnexo(
    req.usuario,
    idTarefa,
    arquivo.name,
    arquivo.size,
    arquivo.mimetype,
    req.uow
  );
  await mkdir('uploads', { recursive: true }); // recursive faz com que ignore se já existir
  await arquivo.mv(`uploads/${idAnexo}`);
  return { id: idAnexo };
});
```

[Exercício 01_excluir_anexo](exercicios/01_excluir_anexo/README.md)

E o download? O ponto de atenção aqui é perceber que o `resp.send` oferece suporte para streams. Veja:

```ts
import { createReadStream } from 'fs';

...

app.get('/:id/anexos/:idAnexo', async (req, resp) => {
  const { id, idAnexo } = req.params as { id: string, idAnexo: string };
  const idTarefa = Number(id);
  const anexo = await consultarAnexoPeloId(req.usuario, idTarefa, idAnexo, req.uow);
  resp.header('Content-Type', anexo.mime_type);
  resp.header('Content-Length', anexo.tamanho);
  await resp.send(createReadStream(`uploads/${idAnexo}`)); // a documentação pede o await aqui
});
```

E agora o método `consultarAnexoPeloId` no arquivo `tarefas/model.ts`:

```ts
interface Anexo {
  id: string;
  nome: string;
  mime_type: string;
  tamanho: number;
  id_tarefa: number;
}

declare module 'knex/types/tables' {
  interface Tables {
    tarefas: Tarefa;
    anexos: Anexo;
  }
}

export async function consultarAnexoPeloId(usuario: Usuario, idTarefa: number, idAnexo: string, uow: Knex): Promise<Anexo> {
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, idTarefa, uow);
  const res = await uow('anexos')
    .select('id', 'id_tarefa', 'nome', 'tamanho', 'mime_type')
    .where('id', idAnexo)
    .first();
  if (res === undefined || res.id_tarefa !== idTarefa) {
    throw new DadosOuEstadoInvalido('Anexo não encontrado', {
      codigo: 'ANEXO_NAO_ENCONTRADO'
    });
  }
  return res;
}
```

Como implementar este download no front end? Lembre-se do Bearer token de autenticação. Uma boa discussão de alternativas pode ser visualizada aqui: https://stackoverflow.com/questions/29452031/how-to-handle-file-downloads-with-jwt-based-authentication. Como os arquivos aqui devem ser pequenos, a solução de fetch com createObjectUrl parece apropriada e suficiente.

[Exercício 02_anexos_no_get_tarefas](exercicios/02_anexos_no_get_tarefas/README.md)
