# Knex

Sua API começa a entregar funcionalidades, mas tem um detalhe importante nela: o que acontece se você reiniciar o processo Node? Isso mesmo, os dados todos se perdem.

Para evitar que os dados se percam entre execuções do seu software a solução é usar algum tipo de *armazenamento persistente*. Olhando no contexto do seu computador, esse armazenamento é o disco magnético ou SSD. Esse disco possui uma *formatação* e é gerenciado pelo sistema operacional, que fornece APIs para usar esse armazenamento, normalmente usando a abstração de diretórios e arquivos. Praticamente todas as linguagens de programação/plataformas de desenvolvimento oferecem alguma maneira de acessar esse armazenamento (tanto para leitura quanto escrita).

Seria possível então usar o sistema de arquivos para obter armazenamento persistente? Com certeza. Para demonstrar, vamos adaptar o model de tarefas para usar o sistema de arquivos (de uma forma muito ingênua, jamais use isso em produção) ao invés de armazenamento em memória. A estratégia será:

- Sumir com a variável `tarefas` e `sequencial`;
- Criar uma função `carregarTarefas` que lê um arquivo com os dados;
- Criar uma função `armazenarTarefas` que substitui esses dados.

Comece criando um arquivo `dados.json` (a extensão não é obrigatória mas ajuda a lembrar do conteúdo) do lado do arquivo `app.js` do projeto. Coloque nele este conteúdo:

```json
{
  "sequencial": 3,
  "tarefas": [
    {
      "id": 1,
      "loginDoUsuario": "pedro",
      "descricao": "Comprar leite",
      "dataDeConclusao": null
    },
    {
      "id": 2,
      "loginDoUsuario": "pedro",
      "descricao": "Trocar lâmpada",
      "dataDeConclusao": "2021-05-03T10:30:00"
    },
    {
      "id": 3,
      "loginDoUsuario": "clara",
      "descricao": "Instalar torneira",
      "dataDeConclusao": null
    }
  ]
}
```

No arquivo `tarefas/model.js` remova as variáveis `sequencial`, `tarefas`, adicione os métodos `carregarTarefas` e `carregarTarefas` e ajuste as outras funções exportadas (note também que o `pausar` não é mais necessário):

```js
import { readFile, writeFile } from 'fs/promises';

import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import { isAdmin } from '../usuarios/model.js';

async function carregarTarefas () {
  const str = await readFile("dados.json", "utf-8");
  return JSON.parse(str);
}

async function armazenarTarefas(tarefas, sequencial) {
  const dados = { sequencial, tarefas };
  await writeFile("dados.json", JSON.stringify(dados, undefined, 2), {
    encoding: "utf-8"
  });
}

export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  let { sequencial, tarefas } = await carregarTarefas();
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    dataDeConclusao: null,
    ...tarefa
  });
  await armazenarTarefas(tarefas, sequencial);
  return sequencial;
}

export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas } = await carregarTarefas();
  const usuarioIsAdmin = await isAdmin(loginDoUsuario);
  let tarefasDisponiveis = usuarioIsAdmin ? tarefas : tarefas.filter(x => x['loginDoUsuario'] === loginDoUsuario);
//...
}

export async function contarTarefasAbertas (loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas } = await carregarTarefas();
  return tarefas.filter(x => x['loginDoUsuario'] === loginDoUsuario).length;
}

export async function buscarTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas } = await carregarTarefas();
  const tarefa = tarefas.find(x => x['id'] === parseInt(id));
//...
}

export async function concluirTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  let { sequencial, tarefas } = await carregarTarefas();
  const tarefa = tarefas.find(x => x['id'] === parseInt(id));
//...
  if (tarefa.dataDeConclusao === null) {
    tarefa.dataDeConclusao = new Date().toISOString(); // expor um boolean não significa que temos que armazenar um, checkmate scaffolders.
  } // sem else para garantir idempotência
  await armazenarTarefas(tarefas, sequencial);
}
```

Quais os problemas com essa implementação? Por qual motivo não devemos utilizar esse tipo de estratégia em um backend? Considere:

- Cada chamada que precisa de uma informação sobre tarefas carrega a lista completa na memória do processo;
- Chamadas que precisam alterar ou adicionar informações novas acabam substituindo o arquivo por completo;
- A implementação do jeito que foi feita não lida muito bem com usuários simultâneos, podendo inclusive acarretar em dados perdidos;
- O arquivo `dados.json` reside em um único disco, sem nada garantindo que exista redundância na informação (se o disco falhar há certamente perda de dados). Esse problema poderia ser resolvido com abstrações no nível do sistema operacional (ex: RAID) mas costuma ser uma feature resolvida em nível de clusterização do sistema de armazenamento.

Podemos também explorar alguns conceitos-chave que giram ao redor de armazenamento:

## ACID

Atomicidade, consistência, isolamento e durabilidade (felizmente as iniciais funcionam em português também) são 4 atributos muito importantes em qualquer provedor de armazenamento persistente. Veja o que significam:

- Atomicidade: um grupo de operações/comandos relacionados deve se comportar de modo "tudo ou nada" (transação);
- Consistência: em nenhuma hipótese dados inconsistentes/inválidos/corrompidos devem ser armazenados;
- Isolamento: transações executadas paralelamente não devem de modo algum interferir umas com as outras (pense em saques/depósitos como um exemplo fácil);
- Durabilidade: uma vez que o sistema de armazenamento disse que a informação foi persistida, ela não será mais perdida.

Sem qualquer um desses 4 atributos a grande maioria das aplicações não seria viável em escala sem exigir uma alta carga de complexidade incidental (em oposição a complexidade essencial de um domínio).

Note que nossa implementação ingênua de armazenamento não provê nenhuma das 4 letras, exceto durabilidade dependendo do ponto de vista e nível de tolerância do leitor.

## CAP Theorem

Este teorema diz que sistemas de armazenamento distribuídos precisam escolher apenas 2 dos 3 atributos abaixo:

- Consistência: todas as leituras recebem a escrita mais recente ou um erro;
- Disponibilidade: todas as operações (leituras/escritas) recebem uma resposta diferente de erro, sem a garantia de ser a escrita mais recente;
- Tolerância a particionamento de rede: o sistema continua operando independente da quantidade de pacotes perdidos na rede.

As consequências desse teorema são profundas e aterrorizam todas as soluções que precisam escalar seus sistemas de armazenamento, pois nunca há uma resposta simples.

Talvez alguns se lembrem do surgimento do serviço Spanner da Google, que causou bastante alvoroço na comunidade que compreendeu errado e concluiu que era um sistema que "desmentia" o teorema CAP. No fundo o Spanner é uma solução (bem cara) que foca na Consistência e Tolerância a particionamento, mas que possui baixíssima taxa de indisponibilidade, a ponto de tornar a ausência do A praticamente negligível na prática. Os links abaixo fornecem boas leituras sobre este tópico:

- https://www.quora.com/Does-Google-Spanner-comply-with-CAP-theorem
- https://cloud.google.com/blog/products/databases/inside-cloud-spanner-and-the-cap-theorem

## Tipos de sistemas de armazenamento

Agora que ficou evidente a necessidade de um sistema robusto para gerenciar os dados da sua aplicação, vamos passar rapidamento pelos principais tipos:

- Relacional (MySQL, PostgreSQL etc): possui como conceito principal as tabelas e registros. Oferece transações e "joins" (consultas cruzando dados de várias tabelas diferentes). É muito flexível e quase sempre a decisão certa para o início da solução. O principal problema com esse tipo de sistema é a dificuldade em escalar horizontalmente por conta da grande quantidade de features incompatíveis com clusterização (sistemas relacionais costumam ser CP no CAP Theorem);

Todos os outros tipos abaixo podem ser categorizados como "NoSQL" (não relacionais). A popularização desses modelos se deu junto com a necessidade de escalar sistemas de armazenamento horizontalmente:

- Documento (MongoDB, CouchDB etc): trabalha com o conceito de "documentos" e "coleções" sem esquema fixo, encorajando duplicação de dado para atingir escalabilidade com performance;

- Chave-valor (Riak, Redis etc): vai ainda mais fundo na simplificação e atua como um grande dicionário/hash. Performance e eficiência muito altas. No caso do Redis, por exemplo, a solução evoluiu e começou a entregar outras coisas também, como canais "pub sub" (que podem servir de base para soluções de mensageria);

- Famílias de colunas (Cassandra);
- Grafos (Neo4J);
- Armazenamento orientado a objetos (Informix, db4o etc).

Um bom livro para aprender mais a respeito é o livro "Seven Databases in Seven Weeks: A Guide to Modern Databases and the NoSQL Movement".

## Armazenamento relacional com PostgreSQL

O restante dessa disciplina irá focar no armazenamento relacional, mais especificamente usando PostgreSQL. Além de ser o sistema mais popular e abrangente, uma boa parte dos conceitos podem ser transferidos para outros sistemas com pouca diferença.

O primeiro passo é garantir que você possui um servidor PostgreSQL executando. Uma opção é instalar direto na sua máquina e outra é subir um container docker da imagem oficial `postgres`. Caso opte pelo docker (recomendado), use o comando abaixo para subir o container:

```sh
$ docker run -d --name ufscar-desenvweb-2021-1 -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

No momento da escrita deste material a versão estável mais recente era a 13: https://www.postgresql.org/support/versioning/.

Você também vai precisar de um client SQL capaz de conversar com o banco de dados. Uma boa recomendação é o `pgAdmin4`, mas nada nesta disciplina impede que você use outras opções como o `DataGrip` ou `DBeaver`.

## Criando a primeira tabela

Antes de discutir como conectar a API na base de dados, vamos criar uma tabela para armazenar os usuários. Para isso você precisa conectar usando o client escolhido, abrir a ferramenta de edição e execução de comandos SQL e executar o comando DDL (linguagem de definição de dados) abaixo:

```sql
create table usuarios (
  id int not null,
  login text not null,
  nome text not null,

  constraint pk_usuarios primary key (id),
  constraint un_usuarios unique (login)
);
```

E depois insira os dados do Pedro e da Clara usando o seguinte DML (linguagem de manipulação de dados):

```sql
insert into usuarios (id, login, nome)
values (1, 'pedro', 'Pedro'),
  (2, 'clara', 'Clara');
```

Você pode conferir se os dados foram persistidos usando a seguinte consulta:

```sql
select * from usuarios;
```

## Visão geral da comunicação com o banco de dados

Agora que temos o sistema de armazenamento disponível, como devemos seguir para conectar nossa API a ele? Existem três principais estratégias, diferenciando-se no nível de abstração em que atuam. São elas:

- Driver direto: a biblioteca usada neste caso é a que se comunica direto com o banco de dados, fornecendo praticamente nenhuma abstração. Uma forma simples de entender é pensar em uma função que recebe comandos SQL e cuida da comunicação com o banco para executá-los, e nada mais;

- ORM (mapeamento objeto relacional): essas bibliotecas estão no outro extremo, escondendo por completo (ou quase isso) o fato de estar lidando com uma base relacional, fornecendo uma API orientada a objetos e cuidando de toda a dinâmica entre esses dois mundos. Pense em um objeto `pessoa` com uma função `getDependentes()` e, caso você manipule os dependentes, uma forma de pedir para a biblioteca cuidar de todo o processo de espelhar as mudanças no banco de dados;

- Query builders (construtores de comandos SQL): essas ficam no meio do caminho, sem o objetivo de esconder o fato de estar lidando com armazenamento relacional, mas também sem exigir que o desenvolvedor "concatene strings".

Analisaremos um exemplo de driver direto, um de ORM e por fim o restante da disciplina irá utilizar o query builder Knex.

## Driver direto

A biblioteca Node.js para conexão com PostgreSQL é a `pg`. Vamos começar instalando ela no projeto usando npm:

```sh
$ npm install pg
```

Crie agora um arquivo chamado `db.js` do lado do `app.js`. Este arquivo vai cuidar da configuração de conexão:

```js
import pg from 'pg';


export async function conectar () {
  const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres'
  }); // note que tudo isso pode (e é boa prática) vir em variáveis de ambiente
  await client.connect();
  return client;
}
```

E agora use essa conexão no método `recuperarDadosDoUsuario` do arquivo `usuarios/model.js`:

```js
export async function recuperarDadosDoUsuario (login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const conexao = await conectar();
  try {
    const res = await conexao.query('select nome from usuarios where login = $1;', [ login ]);
    if (res.rowCount === 0) {
      throw new Error('Usuário não encontrado.');
    }
    const usuario = res.rows[0];
    return {
      nome: usuario['nome']
    };
  } finally {
    await conexao.end();
  }
}
```

## ORM

Do outro lado da régua das maneiras de se comunicar com o banco de dados nós temos as bibliotecas de mapeamento objeto relacional. Elas pedem um bom tanto de configuração e prometem entregar facilidade no desenvolvimento. A biblioteca de ORM mais conhecida no ecossistema Node.js é sem dúvida a `Sequelize`. Existem outras como a `TypeORM`. Antes do código é válido discutir alguns pontos positivos e negativos do uso de ORMs:

Pontos positivos de acordo com [1] e [2] (infelizmente o autor do material discorda de todos, sem exceção):

- Codificar a comunicação com o banco de dados usando a mesma linguagem das regras de negócio/domínio;
- Permite focar os algoritmos no mundo orientado a objetos, sob a premissa de que a ferramenta vai transferir os comandos/consultas para o mundo relacional;
- Facilita a mudança de um SGBD para outro;
- Muitas consultas tem melhor performance comparadas com a escrita direto no SQL (controverso);

[1] https://blog.bitsrc.io/what-is-an-orm-and-why-you-should-use-it-b2b6f75f5e2a
[2] https://www.quora.com/What-are-the-benefits-of-using-an-ORM-layer (segunda resposta)

Pontos negativos usando as mesmas fontes, [3] e também alguns argumentos próprios do autor do material):

[3] https://blog.logrocket.com/why-you-should-avoid-orms-with-examples-in-node-js-e0baab73fa5/#isormreallynecessary

- Curva de aprendizado é longa;
- Usar uma camada de abstração raramente é desculpa para não entender exatamente o que está acontecendo por baixo. A falha de consideração nessa etapa leva o desenvolvedor a tomar decisões ruins que, no médio e longo prazo, acarretam em sérios problemas;
- O fato de tentar mapear domínios bem distintos acarreta em bibliotecas muito complexas.

Como tudo no dia a dia do profissional de TI, usar ou não uma abstração ORM é uma decisão complexa que envolve muitos fatores, sendo um dos principais dele a opinião e composição do time.

Para terminar de exemplificar, vamos configurar o Sequelize no projeto e adaptar a consulta de dados do usuário logado. Comece instalando a biblioteca via npm:

```sh
$ npm install sequelize
```

Teríamos agora que instalar um driver específico do banco de dados, mas já fizemos isso na seção anterior. 

Crie um arquivo `orm.js` que será responsável por expor uma instância do Sequelize configurada com os dados de conexão do banco de dados, da mesma forma que fizemos com o `db.js`:

```js
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/postgres', {
  define: {
    timestamps: false
  }
});

export default sequelize;
```

Agora adapte o arquivo `usuarios/model.js` criando a classe `Usuario`, informando os metadados necessários para o Sequelize e usando essa classe para efetuar a consulta:

```js
import sequelizeLib from 'sequelize';
import sequelize from '../orm.js';
//...
const { DataTypes, Model } = sequelizeLib;
class Usuario extends Model {}
Usuario.init({
  nome: DataTypes.TEXT,
  login: DataTypes.TEXT
}, { sequelize, modelName: 'usuarios' });
//...
export async function recuperarDadosDoUsuario (login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }

  const usuario = await Usuario.findOne({ where: { login } });
  if (usuario === null) {
    throw new Error('Usuário não encontrado.');
  }
  return {
    nome: usuario.nome
  };
}
```

Veja [esta página](https://sequelize.org/master/manual/eager-loading.html) e [esta](https://sequelize.org/master/manual/assocs.html#basics-of-queries-involving-associations) para entender ao mesmo tempo o poder prometido por bibliotecas ORMs e uma de suas maiores armadilhas. Se atente para a capacidade da abstração em confundir o desenvolvedor no peso do código que desenvolve (se usa eager corre o risco de impactar muitos pontos do projeto, se usa lazy corre o risco de executar uma quantidade exorbitante de consultas desnecessariamente).

E veja [esta página](https://sequelize.org/master/manual/creating-with-associations.html) para um exemplo de feature que todos esperam de um ORM mas infelizmente o Sequelize não oferece suporte ("merge" em cascata).

## Query builders

E no meio desses extremos? Caso você não queira concatenar strings nem esconder o modelo relacional atrás de uma biblioteca, você pode usar uma abstração que constrói comandos SQL (um query builder). A opção mais famosa no ecossistema Node.js é o Knex, que usaremos no restante dessa disciplina enquanto construímos nossa API. Note que vários dos conceitos apresentados a frente (como transações, migrações etc) não se aplicam apenas em query builders mas em todos os três esquemas de comunicação.

Vamos adequar novamente o endpoint de busca de dados do usuário logado, dessa vez com Knex. Comece instalando a biblioteca:

```sh
$ npm install knex
```

Note que também teríamos que instalar o driver `pg`, mas já fizemos isso.

Crie agora um arquivo chamado `querybuilder.js` que ficará responsável pela configuração reutilizável:

```js
import knexLib from 'knex';

const knex = knexLib({
  client: 'pg',
  connection: 'postgres://postgres:postgres@localhost:5432/postgres',
  debug: true
});

export default knex;
```

E adapte novamente o arquivo `usuarios/model.js`:

```js
import knex from '../querybuilder.js';
//...
const res = await knex('usuarios')
  .select('nome')
  .where('login', login);
if (res.length === 0) {
  throw new Error('Usuário não encontrado.');
}
return res[0];
```

Proposta de exercício: adapte o método `recuperarLoginDoUsuarioAutenticado` de modo que ele passe a consultar a informação do banco de dados. Passos necessários: 1) criar uma tabela chamada `autenticacoes` com os campos `id` (do tipo `uuid`) e `id_usuario` (do tipo `int`, com uma chave estrangeira para a tabela de usuários); 2) inserir alguns registros para testes; 3) adaptar o método no model.

```sql
create table autenticacoes (
  id uuid not null,
  id_usuario int not null,

  constraint pk_autenticacoes primary key (id),
  constraint fk_autenticacoes_usuario foreign key (id_usuario) references usuarios (id)
);
insert into autenticacoes (id, id_usuario) values ('a0b5902c-4f2d-429c-af40-38f00cddd3a6', 1);
```

```js
export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  const res = await knex('usuarios')
    .join('autenticacoes', 'autenticacoes.id_usuario', 'usuarios.id')
    .where('autenticacoes.id', autenticacao)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new AutenticacaoInvalida();
  }
  return res[0]['login'];
}
```

## Adequação da função de autenticação

Vamos agora adequar a função que cria autenticações validando as credenciais do usuário. Dessa vez não vamos armazenar a senha em texto plano, utilizaremos uma biblioteca que permite gerar hashes BCrypt (uma boa opção para este tipo de caso de uso). Comece instalando essa biblioteca:

```sh
$ npm install bcryptjs
```

Abra um console Node.js escrevendo apenas `node` no terminal. Importe a biblioteca e execute o seguinte código para encriptar uma senha:

```js
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('123456', 8));
```

Crie agora uma coluna `senha` na tabela de usuários e preencha-a com o valor obtido:

```sql
alter table usuarios add senha text;
update usuarios set senha = '$2a$08$vV2fkDIM66LxH1.8DS3sTOEE1okecuRUXIg0b4gc9umej4eVJX/Zy'; -- note que isso vai aplicar para TODOS os usuários
alter table usuarios alter senha set not null;
```

Por fim adeque a função `autenticar` no arquivo `usuarios/model.js`:

```js
import bcrypt from 'bcryptjs';
//...
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
  const autenticacao = uuidv4();
  await knex('autenticacoes')
    .insert({ id: autenticacao, id_usuario: usuario.id });
  return autenticacao;
}
```

Proposta de exercício: adeque o endpoint `PUT /usuarios/logado/nome`. Caso você tenha feito o tratamento de usuário ser ou não admin, agora é a hora de retirar este código.

```js
export async function alterarNomeDoUsuario (novoNome, login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  if (novoNome === undefined || novoNome === '') {
    throw new DadosOuEstadoInvalido('CampoObrigatorio', 'Informe o novo nome.');
  }
  await knex('usuarios')
    .update('nome', novoNome);
}
```

Repare que neste momento *todo* o model de usuários está adaptado! Sem uma única mudança necessária na camada de roteamento.

## Evoluindo o modelo (migrações de esquema)

Um sistema nunca para de ser evoluído, isso todo mundo que trabalha com software sabe. Como então lidar com as inevitáveis mudanças necessárias no banco de dados conforme adicionamos/alteramos funcionalidades da nossa API? Para isso existem ferramentas de migração de esquema. Essas ferramentas trabalham da seguinte forma:

- Você escreve scripts que indicam como evoluir o esquema (criando tabelas, adicionando colunas etc);
- A ferramenta olha para uma tabela de metadados no banco de destino e aplica os scripts que ainda não foram aplicados.

Essa estratégia é bem poderosa, pois permite que exatamente o mesmo script (ou coleção de últimos scripts) seja aplicado nos mais diversos ambientes do projeto (local, testes, produção etc).

O Knex oferece uma ferramenta dessa nativamente, e utilizaremos essa ferramenta a partir de agora. Comece criando um arquivo `knexfile`:

```sh
$ ./node_modules/.bin/knex init
```

Altere o arquivo `knexfile.js` deixando-o dessa forma:

```js
export const development = {
  client: 'postgresql',
  connection: 'postgres://postgres:postgres@localhost:5432/postgres',
  migrations: {
    tableName: 'knex_migrations'
  }
};
```

Remova as tabelas `usuarios` e `autenticacoes`. Criaremos elas novamente usando migrations.

```sql
drop table autenticacoes;
drop table usuarios;
```

Crie a primeira migração com o seguinte comando:

```sh
$ ./node_modules/.bin/knex --esm migrate:make cria_tabela_usuarios
```

Implemente-a com o seguinte código:

```js
export async function up (knex) {
  await knex.schema.createTable('usuarios', function (table) {
    table.increments();
    table.text('login').notNullable();
    table.text('nome').notNullable();
    table.text('senha').notNullable();
  });
};

export async function down (knex) {
  await knex.schema.dropTable('usuarios');
};
```

E execute-a com o seguinte comando:

```sh
$ ./node_modules/.bin/knex --esm migrate:latest
```

É possível usar o comando `down` para reverter o último lote executado:

```sh
$ ./node_modules/.bin/knex --esm migrate:down
```

Uma consideração importante é que alguns projetos decidem *não* oferecer suporte para rollback (o método `down` das migrações). Garantir a qualidade desses módulos é custoso e eles praticamente nunca são usados, portanto o argumento principal é não implementá-los e atuar nos rollbacks manualmente quando algum imprevisto ocorrer nos ambientes produtivos.

Crie uma migration agora para a tabela `autenticacoes`:

```sh
$ ./node_modules/.bin/knex --esm migrate:make criar_tabela_autenticacoes
```

E implemente-a:

```js
export async function up (knex) {
  await knex.schema.createTable('autenticacoes', function (table) {
    table.uuid('id').primary();
    table.integer('id_usuario').notNullable().references('usuarios.id');
  });
}

export async function down () {
  throw new Error('não suportado');
}
```

Proposta de exercício: crie uma migration para uma tabela de categorias (id auto incremento como chave primária e uma coluna `descricao`, obrigatória, tipo texto).

```sh
$ ./node_modules/.bin/knex --esm migrate:make criar_tabela_categorias
```

```js
export async function up (knex) {
  await knex.schema.createTable('categorias', function (table) {
    table.increments();
    table.text('descricao').notNullable();
  });
}

export async function down () {
  throw new Error('não suportado');
}
```

## Continuação das adequações

Vamos continuar as adequações, agora focando no model de tarefas. O primeiro passo vai ser adequar o cadastro de tarefa. Comece criando a migração responsável pela tabela:

```sh
$ ./node_modules/.bin/knex --esm migrate:make criar_tabela_tarefas
```

```js
export async function up (knex) {
  await knex.schema.createTable('tarefas', function (table) {
    table.increments();
    table.text('descricao').notNullable();
    table.integer('id_categoria').notNullable().references('categorias.id');
    table.integer('id_usuario').notNullable().references('usuarios.id');
    table.timestamp('data_conclusao');
  });
}

export async function down () {
  throw new Error('não suportado');
}
```

Adapte agora o método `cadastrarTarefa` dentro do arquivo `tarefas/model.js`:

```js
export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .insert({
      descricao: tarefa.descricao,
      id_categoria: tarefa.id_categoria,
      id_usuario: knex('usuarios').select('id').where('login', loginDoUsuario)
    })
    .returning('id');
  return res[0];
}
```

Adapte também o roteador `tarefas/router.js` adicionando o campo `id_categoria` no schema:

```js
const tarefaSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    id_categoria: { type: 'number' }
  },
  required: [ 'descricao', 'id_categoria' ]
};
```

Proposta de exercício: adeque o endpoint `GET /tarefas/{id}` e depois implemente o endpoint `PATCH /tarefas/{id}`. Este endpoint deve receber uma nova descrição e/ou uma nova categoria e aplicar no registro. Caso você tenha desenvolvido o endpoint que conta as tarefas, adapte-o também.

```js
export async function buscarTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', id)
    .select('usuarios.login', 'tarefas.descricao', 'tarefas.data_conclusao');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  return {
    descricao: tarefa.descricao,
    concluida: !!tarefa.data_conclusao
  };
}
```

```js
import { buscarTarefa, cadastrarTarefa, alterarTarefa, concluirTarefa, consultarTarefas, contarTarefasAbertas } from './model.js';
//...
const tarefaPatchSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    id_categoria: { type: 'number' }
  },
  required: []
};
//...
router.patch('/:id', schemaValidator(tarefaPatchSchema), asyncWrapper(async (req, res) => {
  const patch = req.body;
  await alterarTarefa(req.params.id, patch, req.loginDoUsuario);
  res.sendStatus(204);
}));
```

```js
export async function alterarTarefa (id, patch, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', id)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  const values = {};
  if (patch.descricao) values.descricao = patch.descricao;
  if (patch.id_categoria) values.id_categoria = patch.id_categoria;
  if (Object.keys(values).length === 0) return;
  await knex('tarefas')
    .update(values)
    .where('id', id);
}
```

```js
export async function contarTarefasAbertas (loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('login', loginDoUsuario)
    .whereNull('data_conclusao')
    .count('tarefas.id');
  return parseInt(res[0].count);
}
```

Vamos adequar agora o `GET /tarefas`:

```js
export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  let query = knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .andWhere('usuarios.login', loginDoUsuario)
    .select('tarefas.id', 'descricao', 'data_conclusao');
  if (termo !== undefined && termo !== '') {
    query = query.where('descricao', 'ilike', `%${termo}%`);
  }
  const res = await query;
  return res.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.data_conclusao
  }));
}
```

Proposta de exercício: adeque os endpoints `POST /tarefas/{id}/concluir` e `POST /tarefas/{id}/reabrir`.

```js
export async function concluirTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', id)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  await knex('tarefas')
    .update({ data_conclusao: new Date() })
    .where('id', id);
}
```

```js
export async function reabrirTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', id)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  await knex('tarefas')
    .update({ data_conclusao: null })
    .where('id', id);
}
```

```js
router.post('/:id/reabrir', asyncWrapper(async (req, res) => {
  await reabrirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));
```

Note que aqui acabaram as adequações! Daqui pra frente serão apenas novos endpoints.

## Exclusão de tarefa

Um endpoint relativamente simples que ficou de fora até agora é a exclusão de uma tarefa. Existem duas abordagens para exclusões: física e lógica. A exclusão física remove mesmo o registro do banco de dados, enquanto a exclusão lógica apenas muda um campo no registro (boolean ou uma data) indicando que ele foi excluído. O benefício da exclusão física é a simplicidade, enquanto o benefício da exclusão lógica é manter um registro melhor dos dados em troca de ter que tomar muito cuidado para limitar todas as consultas que usam essa tabela a desconsiderarem os registros excluídos.

Comece implementando no arquivo `tarefas/router.js`:

```js
router.delete('/:id', asyncWrapper(async (req, res) => {
  await deletarTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));
```

E depois adicione o método no `tarefas/model.js`:

```js
export async function deletarTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', id)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  await knex('tarefas')
    .delete()
    .where('id', id);
}
```

Note que temos algumas oportunidades de refatoração nesse model. O código que busca uma tarefa apenas para validar o acesso está sendo utilizado em muitos lugares e vale ser extraído:

```js
export async function alterarTarefa (id, patch, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  const values = {};
  if (patch.descricao) values.descricao = patch.descricao;
  if (patch.id_categoria) values.id_categoria = patch.id_categoria;
  if (Object.keys(values).length === 0) return;
  await knex('tarefas')
    .update(values)
    .where('id', id);
}

export async function deletarTarefa (id, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  await knex('tarefas')
    .delete()
    .where('id', id);
}

async function assegurarExistenciaEAcesso (idTarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', idTarefa)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
}
```

## Transações (atomicidade)

Vamos implementar agora o vínculo de etiquetas com as tarefas. Note que o endpoint deve receber qualquer etiqueta e criá-la caso ainda não exista, atribuindo uma cor aleatória. Esse comportamento é novo, pois até o momento não tivemos nenhum caso parecido onde um único endpoint chama duas operações diferentes. Isso traz novas preocupações, principalmente com relação a atomicidade (ou tudo ou nada) da ação.

Começaremos implementando uma versão ingênua e depois vamos evoluí-la, incorporando conceitos que resolvem o problema. O primeiro passo é criar a tabela de etiqueta e uma tabela que representa as etiquetas vinculadas com as tarefas:

```sh
$ ./node_modules/.bin/knex --esm migrate:make criar_tabela_etiquetas_e_tarefa_etiqueta
```

```js
export async function up (knex) {
  await knex.schema.createTable('etiquetas', function (table) {
    table.increments();
    table.text('descricao').notNullable();
    table.text('cor').notNullable();
  });
  await knex.schema.createTable('tarefa_etiqueta', function (table) {
    table.integer('id_tarefa').references('tarefas.id');
    table.integer('id_etiqueta').references('etiquetas.id');
    table.primary(['id_tarefa', 'id_etiqueta']);
  });
}

export async function down () {
  throw new Error('não suportado');
}
```

Crie agora uma pasta chamada `etiquetas`, com um arquivo chamado `model.js` dentro dela com o seguinte conteúdo:

```js
import knex from '../querybuilder.js';

export async function cadastrarEtiquetaSeNecessario (descricao) {
  let res = await knex('etiquetas')
    .select('id')
    .where('descricao', descricao);
  if (res.length === 0) {
    res = await knex('etiquetas')
      .insert({
        descricao,
        cor: gerarCorAleatoria()
      })
      .returning('id');
    return res[0];
  } else {
    return res[0].id;
  }
}

function gerarCorAleatoria () {
  const num = Math.round(0xffffff * Math.random());
  const r = num >> 16;
  const g = num >> 8 & 255;
  const b = num & 255;
  return `rgb(${r}, ${g}, ${b})`;
}
```

Adicione agora o seguinte método no modelo de tarefas:

```js
export async function vincularEtiqueta (idTarefa, etiqueta, loginDoUsuario) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(etiqueta);
  await knex('tarefa_etiqueta')
    .insert({
      id_tarefa: idTarefa,
      id_etiqueta: idEtiqueta
    })
    .onConflict().ignore();
}
```

E por fim o endpoint no router de tarefas:

```js
router.post('/:id/etiquetas', schemaValidator(vincularEtiquetaSchema), asyncWrapper(async (req, res) => {
  await vincularEtiqueta(req.params.id, req.body.etiqueta, req.loginDoUsuario);
  res.sendStatus(204);
}));
```

Pare um momento e analise o que ocorre se o código que insere o vínculo entre tarefa e etiqueta falhar. Você pode ter chegado à conclusão que a etiqueta vai permanecer cadastrada. Isso ocorre pois o endpoint não está se comportando de maneira atômica. Neste caso pode parecer inofensivo, mas nem sempre será assim (pense em uma situação mais complicada envolvendo por exemplo saques e depósitos bancários).

Sistemas de gerenciamento de bancos de dados relacionais trazem um mecanismo que permite tornar vários comandos SQL atômicos. Esse conceito é o conceito de transações. A ideia é que você abra uma transação, execute os comandos, e eventualmente confirme (faça o `commit`) ou reverta tudo (fazendo o `rollback`).

O Knex oferece transações através dos métodos `knex.transaction(async trx => {})` e `knex.transacting(trx)`. O primeiro cria uma transação e, ao final da promise, faz o commit ou rollback dependendo do fato de ter ocorrido algum erro ou não. O método `transacting` permite que uma operação entre em uma `trx` existente. A instância `trx` se comporta como um objeto `knex`, ou seja é possível chamar `select`, `insert` etc direto nela.

Com base nisso qual seria a melhor maneira de desenhar o suporte a transações no nosso model? Lembre-se que queremos que garantir que todas as operações chamadas para atender determinada requisição participem da mesma transação. Existe um padrão de projeto muito bom nessas horas que é o `Unit of Work`. A ideia é criar um objeto que acompanha toda a chamada ao redor da camada de modelo, e esse objeto é usado sempre que uma operação de banco de dados precisa descobrir qual transação participar. Comece criando o seguinte método no arquivo `querybuilder.js`:

```js
export function comUnidadeDeTrabalho () {
  return function (req, res, next) {
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

Use esse middleware customizado no endpoint de cadastro de etiqueta, e passe a unidade de trabalho pra dentro da camada de modelo:

```js
router.post('/:id/etiquetas', schemaValidator(vincularEtiquetaSchema), comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await vincularEtiqueta(req.params.id, req.body.etiqueta, req.loginDoUsuario, req.uow);
  res.sendStatus(204);
}));
```

E por fim use nos dois arquivos de modelo impactados:

```js
export async function vincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(etiqueta, uow);
  await knex('tarefa_etiqueta')
    .transacting(uow)
    .insert({
      id_tarefa: idTarefa,
      id_etiqueta: idEtiqueta
    })
    .onConflict().ignore();
}
```

```js
export async function cadastrarEtiquetaSeNecessario (descricao, uow) {
  let res = await knex('etiquetas')
    .transacting(uow)
    .select('id')
    .where('descricao', descricao);
  if (res.length === 0) {
    res = await knex('etiquetas')
      .transacting(uow)
      .insert({
        descricao,
        cor: gerarCorAleatoria()
      })
      .returning('id');
    return res[0];
  } else {
    return res[0].id;
  }
}
```

Existem outras abordagens além da unidade de trabalho para compartilhamento de transação na camada de modelo:

- Uma transação por thread (funciona em plataformas e frameworks onde uma request é atendida por completo em uma única thread);
- "Decorators", "anotações" nos métodos demarcando fronteiras de transação.

Um enorme benefício da unidade de trabalho, como veremos adiante, é a facilidade com que ela permite a implementação de testes unitários e de integração.

Proposta de exercício: implemente o endpoint `DELETE /tarefas/{id}/etiquetas/{etiqueta}`. Receba descrição e não o ID. Para o front end não queremos expor a chave primária da tabela de etiquetas. Se for o único uso da etiqueta, remova-a. Coloque tudo isso em uma unidade de trabalho.

```js
router.delete('/:id/etiquetas/:descricao', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await desvincularEtiqueta(req.params.id, req.params.descricao, req.loginDoUsuario, req.uow);
  res.sendStatus(204);
}));
```

```js
export async function desvincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const idEtiqueta = await buscarIdEtiquetaPelaDescricao (etiqueta, uow);
  await knex('tarefa_etiqueta')
    .transacting(uow)
    .delete()
    .where({
      id_tarefa: idTarefa,
      id_etiqueta: idEtiqueta
    });
  await removerEtiquetaSeObsoleta(idEtiqueta, uow);
}
```

```js
export async function removerEtiquetaSeObsoleta (idEtiqueta, uow) {
  const res = await knex('tarefa_etiqueta')
    .transacting(uow)
    .count('id_tarefa')
    .where('id_etiqueta', idEtiqueta);
  if (parseInt(res[0].count) === 0) {
    await knex('etiquetas')
      .transacting(uow)
      .delete()
      .where('id', idEtiqueta);
  }
}

export async function buscarIdEtiquetaPelaDescricao (descricao, uow) {
  const res = await knex('etiquetas')
    .transacting(uow)
    .select('id')
    .where('descricao', descricao);
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('EtiquetaNaoExiste', 'Etiqueta não existe.');
  }
  return res[0].id;
}
```

## Alguns endpoints de suporte e adaptação do GET /tarefas

Para aliviar um pouco a teoria vamos adicionar um endpoint de suporte: o `GET /etiquetas`. O frontend vai utilizar este endpoint para obter as cores das etiquetas.

Comece implementando um método `buscarEtiquetas` no arquivo `etiquetas/model.js`:

```js
export async function buscarEtiquetas (uow) {
  return await knex('etiquetas')
    .transacting(uow)
    .select('descricao', 'cor');
}
```

Crie um `etiquetas/router.js`:

```js
import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';
import { buscarEtiquetas } from './model.js';

const router = express.Router();

router.get('', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const etiquetas = await buscarEtiquetas(req.uow);
  res.send(etiquetas);
}));

export default router;
```

Não se esqueça de instalar o novo router no `app.js`:

```js
//...
import tarefasRouter from './tarefas/router.js';
import etiquetasRouter from './etiquetas/router.js';
//...
app.use('/usuarios', usuariosRouter);

app.use('/etiquetas', etiquetasRouter);

app.use((_req, res) => {
//...
```

Proposta de exercício: implemente agora o `GET /categorias`.

```js
import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';
import { buscarCategorias } from './model.js';

const router = express.Router();

router.get('', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const categorias = await buscarCategorias(req.uow);
  res.send(categorias);
}));

export default router;
```

```js
import knex from '../querybuilder.js';

export async function buscarCategorias (uow) {
  return await knex('categorias')
    .transacting(uow)
    .select('id', 'descricao');
}
```

```js
app.use('/categorias', categoriasRouter);
```

Neste ponto podemos aproveitar para retornar as etiquetas da tarefa no endpoint `GET /tarefas`. Para isso adapte o método `consultarTarefas` no arquivo `tarefas/model.js`:

```js
export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  let query = knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .andWhere('usuarios.login', loginDoUsuario)
    .select('tarefas.id', 'descricao', 'data_conclusao');
  if (termo !== undefined && termo !== '') {
    query = query.where('descricao', 'ilike', `%${termo}%`);
  }
  const res = await query;

  const idsTarefa = res.map(x => x.id);
  const resEtiquetas = await knex('tarefa_etiqueta')
    .join('etiquetas', 'etiquetas.id', 'tarefa_etiqueta.id_etiqueta')
    .select('id_tarefa', 'etiquetas.descricao', 'etiquetas.cor')
    .whereIn('tarefa_etiqueta.id_tarefa', idsTarefa);
  const mapaEtiquetas = {};
  for (const vinculo of resEtiquetas) {
    const idTarefa = vinculo.id_tarefa;
    if (mapaEtiquetas[idTarefa] === undefined) {
      mapaEtiquetas[idTarefa] = [];
    }
    mapaEtiquetas[idTarefa].push({
      etiqueta: vinculo.descricao,
      cor: vinculo.cor
    });
  }

  return res.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.data_conclusao,
    etiquetas: mapaEtiquetas[x.id] || []
  }));
}
```

Proposta de exercício: corrija a exclusão de tarefa com etiquetas. Bônus: limpe as etiquetas obsoletas.

```js
export async function deletarTarefa (id, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  await knex('tarefa_etiqueta')
    .delete()
    .where('id_tarefa', id);
  await knex('tarefas')
    .delete()
    .where('id', id);
}
```
