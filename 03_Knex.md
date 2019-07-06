# Knex

Até agora não foi discutido nenhum mecanismo de persistência de dados para as APIs desenvolvidas. Utilizar a memória do processo é útil mas possui grandes limitações, sendo a mais óbvia delas a não-persistência entre reinicializações da sua aplicação, ou até mesmo o não compartilhamento entre os vários processos de um cluster.

Quando se analisa as possíveis escolhas para persistência de dados em um projeto, o modelo mais simples e difundido é o uso de uma base de dados relacional. O fato de possuir um esquema robusto, ser flexível, ter muito conhecimento difundido na Internet e escalar apropriadamente para a grande maioria dos cenários a qual é subjulgada faz desse tipo de base de dados a escolha padrão. É quando o cenário é específico demais, seja pelo volume de informações, modelo muito variado, características de acesso recursivas dentre outras peculiaridades que outros modelos como o baseado em documentos, chave-valor ou grafos surgem para atender a demanda.

Uma vez decidido o uso de uma base relacional, o próximo passo é escolher o sistema gerenciador de base de dados (MySQL, PostgreSQL, SQL Server etc.). Os fatores que permeiam essa decisão estão fora do escopo dessa disciplina, e não influenciam significativamente no próximo passo. Para o decorrer da disciplina o SGBD PostgreSQL será utilizado, por conveniência.

## Criação das tabelas no PostgreSQL

Antes de prosseguir, será necessário criar as tabelas que refletem o modelo da aplicação de gestão de tarefas que vem sendo desenvolvida até então. Além das tabelas de usuários e tarefas, serão criadas posteriormente tabelas de etiquetas e checklists, permitindo a análise de relacionamentos do tipo muitos para muitos e um para muitos.

O restante do material assume que você possui um servidor PostgreSQL versão 9 ou superior, e credenciais de acesso a ele. Recomenda-se o uso do cliente `pgAdmin`, mas não é uma exigência.

Crie primeiramente uma tabela de usuários, usando o seguinte comando SQL:

```sql
create sequence usuarios_id_seq;

create table usuarios (
  id int not null,
  login varchar(100) not null,
  senha bytea not null,

  constraint pk_usuarios primary key (id),
  constraint un_usuarios_login unique (login)
);
```

Crie agora a tabela de tarefas:

```sql
create sequence tarefas_id_seq;

create table tarefas (
  id int not null,
  usuario_id int not null,
  descricao varchar(100) not null,
  previsao timestamp not null,
  conclusao timestamp,

  constraint pk_tarefas primary key (id),
  constraint fk_tarefas_usuario foreign key (usuario_id) references usuarios (id)
);
```

### Nota sobre armazenamento de hashes/GUIDs

Quando se discute sobre armazenamento de senhas, é senso comum *não armazená-las* como texto plano, pois isso é uma falha gravíssima de segurança. O que se discute com menos frequência é a técnica de *espalhamento/hash* usada para proteger o valor antes de armazená-lo, e que tipo de dado utilizar na base.

Com relação às possíveis técnicas, uma combinação bastante aceita é a seguinte: use uma função espalhadora forte, como a SHA-256, *repetidamente* sobre o valor de entrada *concatenado* com uma palavra segredo, chamada de *salt*. Por exemplo, se a senha do usuário é `123456`, você pode obter um hash seguro com esse código Node:

```js
const crypto = require('crypto');

console.log(crypto.createHash('sha256')
    .update('123456')
    .digest());

console.log(crypto.createHash('sha256')
    .update('123456')
    .digest('hex'));

console.log(crypto.createHash('sha256')
    .update('123456')
    .digest('base64'));

const senha = '123456';
const salt = 'segredo';
let resultado = `${salt}${senha}`;
for (let i = 0; i < 10; i++) {
    resultado = crypto.createHash('sha256')
        .update(resultado)
        .digest();
}
console.log(resultado);
```

Isso produz um vetor de 32 bytes que pode ser armazenado no banco, mas como armazená-lo? Dentre os possíveis formatos, três se destacam:

- Uso de uma coluna de texto de 44 posições e armazenar o valor codificado como base64.
- Uso de uma coluna de texto de 64 posições e armazenar o valor codificado como hexadecimal.
- Uso de uma coluna de vetor de bytes de 32 posições e armazenar o valor sem codificação.

Normalmente se usa uma das primeiras duas opções, pois manipular cadeias de caracteres costuma ser mais conveniente e o ganho de performance/armazenamento não é tão expressivo, mas nesse material utilizaremos a terceira para ter uma visão diferente sobre o tema.

## Driver, Query Builder ou ORM?

O último passo é decidir como interfacear com o banco de dados no código da sua aplicação. Neste ponto existem três categorias principais, cada uma com seus prós e contras. Vale notar que nenhuma opção é indiscutivelmente melhor que a outra, e é possível encontrar boas discussões na Internet sobre o assunto [1].

[1] https://blog.logrocket.com/why-you-should-avoid-orms-with-examples-in-node-js-e0baab73fa5/

### Driver baixo nível

Para scripts simples, projetos muito pequenos ou que exijam máxima atenção com performance, a melhor opção pode ser usar uma biblioteca que simplesmente encapsula a conexão com o banco de dados, não ajudando em muito além disso.

Para exercitar esse modelo, implemente um script que cadastra usuários na base com uma senha pré-definida. Comece instalando no projeto o pacote `pg`:

```
npm install pg
```

E implemente um script com o seguinte código:

```js
const crypto = require('crypto');
const { Client } = require('pg');
const client = new Client();

async function main() {

    await client.connect();

    const login = 'samuel';
    const senha = '123456';

    const salt = 'segredo';
    let senhaCriptografada = `${salt}${senha}`;
    for (let i = 0; i < 10; i++) {
        senhaCriptografada = crypto.createHash('sha256')
            .update(senhaCriptografada)
            .digest();
    }

    const res = await client.query(
        'insert into usuarios (id, login, senha) ' +
        'values (nextval(\'usuarios_id_seq\'), $1, $2)',
        [login, senhaCriptografada]);

    console.log(`Linhas alteradas: ${res.rowCount}`);
    await client.end();

}

main();
```

Ao tentar executar o script, a aplicação irá estourar com um erro de autenticação. Isso é natural, afinal não foi informada a ela as credenciais de acesso ao PostgreSQL. Existem duas maneiras de resolver isso. Uma delas é através do uso de variáveis de ambiente:

```
PGUSER=postgres PGDATABASE=db PGPASSWORD=postgres node script.js
```

Lembre-se de ajustar os valores conforme apropriado para o seu cenário.

A outra opção é passar as credenciais direto no script:

```js
const client = new Client({
    database: 'db',
    user: 'postgres',
    password: 'postgres'
});
```

Cada projeto vai definir a estratégia que melhor lhe couber, mas recentemente tem-se dado preferência para variáveis de ambiente, pois são mais amigáveis com múltiplos ambientes e containerização.

Dica: use o comando SQL `select encode(senha, 'hex') from usuarios;` para obter uma versão legível da senha. `encode(senha, 'base64')` também é muito útil.

### ORM

Com a popularização da programação orientada a objetos, naturalmente surgiram ideias para facilitar o uso de bases de dados relacionais neste meio. Uma das vertentes mais agressivas propõe o maior nível de abstração possível, e é chamada de ORM (mapeamento objeto-relacional). A ideia do ORM é configurar previamente um conjunto de classes (ou equivalente) e atributos de modo a representarem o modelo de tabelas/colunas do banco de dados em um grafo de objetos. Com base nessa configuração, a ferramenta de ORM é capaz de fornecer APIs de consulta e manipulação dos dados de maneira simplificada.

A primeira vista essa parece a melhor opção, mas como o mapeamento entre orientação a objetos e modelo de dados relacional é complexo e incompleto, o resultado quase sempre é o sacríficio de performance para o ganho de simplicidade e produtividade no desenvolvimento. Portanto o uso dessa técnica deve ser feito com cuidado, e ela nem de longe exime o desenvolvedor de possuir um conhecimento aprofundado em modelos relacionais.

Para entender o funcionamento de um ORM, com a finalidade de comparar com o uso do Query Builder Knex, será mostrado agora como desenvolver uma API capaz de autenticar usuários, listar e trazer detalhes de tarefas usando o ORM `Sequelize`.

Comece criando um novo projeto Express com autenticação e geração de token JWT:

```
npm init
npm i express express-jwt jsonwebtoken moment
```

```js
const express = require('express');
const jwt = require('express-jwt');
const { SEGREDO_JWT } = require('./seguranca');
const loginRouter = require('./login/login-router');
const tarefasRouter = require('./tarefas/tarefas-router');

const app = express();

app.use(express.json());

app.use(jwt({
    secret: SEGREDO_JWT
}).unless({ path: '/login' }));

app.use('/login', loginRouter);
app.use('/tarefas', tarefasRouter);

app.listen(3000);
```

Crie o módulo `seguranca`:

```js
module.exports.SEGREDO_JWT = 'ormsegredo';
```

Crie o roteador de login:

```js
const express = require('express');
const jsonwebtoken = require('jsonwebtoken');
const moment = require('moment');
const loginService = require('./login-service');
const { SEGREDO_JWT } = require('../seguranca');


const router = express.Router();

router.post('/', (req, res) => {
    const { usuario, senha } = req.body;
    loginService.credenciaisValidas(usuario, senha)
        .then(validas => {
            if (validas) {
                const token = jsonwebtoken.sign({
                    sub: usuario,
                    exp: moment().add(30, 'minutes').unix()
                }, SEGREDO_JWT);
                res.send({ token });
            } else {
                res.status(401).send();
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send();
        });
});

module.exports = router;
```

Agora o esqueleto do serviço de login:

```js
module.exports.credenciaisValidas = (usuario, senha) => {
    return Promise.resolve(true); // será substituído pela integração com ORM
};
```

Crie também o router de tarefas:

```js
const express = require('express');
const tarefasService = require('./tarefas-service');


const router = express.Router();

router.get('/', async (req, res) => {
    const usuario = req.user.sub;
    try {
        const tarefas = await tarefasService.listar(usuario);
        res.send(tarefas.map(tarefa => ({
            id: tarefa.id,
            descricao: tarefa.descricao,
            previsao: tarefa.previsao,
            conclusao: tarefa.conclusao
        })));
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get('/:id', async (req, res) => {
    const usuario = req.user.sub;
    const id = req.params.id;
    try {
        const tarefa = await tarefasService.buscarPorId(id);
        if (!tarefa) {
            res.status(404).send();
        } else if (tarefa.usuario.login !== usuario) {
            res.status(403).send();
        } else {
            res.send({
                id: tarefa.id,
                descricao: tarefa.descricao,
                previsao: tarefa.previsao,
                conclusao: tarefa.conclusao
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

module.exports = router;
```

E o esqueleto do service de tarefas:

```js
const moment = require('moment');


module.exports.listar = usuario => {
    return Promise.resolve([{
        id: 1,
        descricao: 'Tarefa 1',
        previsao: moment(),
        conclusao: null,
        usuario: {
            login: 'samuel'
        }
    }]);
};


module.exports.buscarPorId = id => {
    return Promise.resolve({
        id,
        descricao: 'Tarefa 1',
        previsao: moment(),
        conclusao: null,
        usuario: {
            login: 'samuel'
        }
    });
};
```

Depois de garantir que essa base está funcionando corretamente, o próximo passo é configurar o `Sequelize` e ajustar os módulos de serviço para buscar os dados no banco.

Primeiro instale a biblioteca e o driver PostgreSQL usado por ela:

```
npm i sequelize pg pg-hstore
```

Agora crie um módulo chamado `orm` na raíz do projeto, com o seguinte conteúdo:

```js
const Sequelize = require('sequelize');


module.exports.sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/tarefas1', {
    define: {
        timestamps: false,
        underscored: true
    }
});
```

Agora crie o módulo `usuarios/usuarios-modelo`:

```js
const Sequelize = require('sequelize');
const { sequelize } = require('../orm');


module.exports.Usuario = sequelize.define('usuario', {
    login: {
        type: Sequelize.STRING,
        allowNull: false
    },
    senha: {
        type: Sequelize.BLOB,
        allowNull: false
    }
});
```

E o módulo `tarefas/tarefas-modelo`:

```js
const Sequelize = require('sequelize');
const { sequelize } = require('../orm');
const { Usuario } = require('../usuarios/usuarios-modelo');


const Tarefa = sequelize.define('tarefa', {
    descricao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    previsao: {
        type: Sequelize.DATE,
        allowNull: false
    },
    conclusao: {
        type: Sequelize.DATE
    }
});
Tarefa.belongsTo(Usuario);

module.exports.Tarefa = Tarefa;
```

Por fim adapte os serviços de login e tarefas:

```js
const crypto = require('crypto');
const { Usuario } = require('../usuarios/usuarios-modelo');


const criptografar = senha => {
    const salt = 'segredo';
    let senhaCriptografada = `${salt}${senha}`;
    for (let i = 0; i < 10; i++) {
        senhaCriptografada = crypto.createHash('sha256')
            .update(senhaCriptografada)
            .digest();
    }
    return senhaCriptografada;
};


module.exports.credenciaisValidas = async (login, senha) => {
    const usuario = await Usuario.findOne({
        where: { login, senha: criptografar(senha) }
    });
    return !!usuario;
};
```

```js
const { Tarefa } = require('./tarefas-modelo');
const { Usuario } = require('../usuarios/usuarios-modelo');


module.exports.listar = usuario => {
    return Tarefa.findAll({
        include: [{
            model: Usuario,
            where: { login: usuario }
        }]
    });
};


module.exports.buscarPorId = id => {
    return Tarefa.findByPk(id, {
        include: [{
            model: Usuario
        }]
    });
};
```

### Query Builder

TODO:

- ORM vs. SQL QueryBuilder
    ORM: descrever, configurar o sequelize com modelos de tarefas e usuários e ajustar a API para autenticar, listar e trazer detalhes junto com o nome do usuário além dos dados da tarefa em si
    SQL QueryBuilder: instalação do Knex e refatoração dos endpoints primeiro select/insert
- Uso de migrações nativas e db-migrate
- Refatoração completa do tarefas-modelo

    Auto incremento ou GUID? GUID muito grande (char(32) vs uuid)?
    No upload mostrar tanto no banco quanto no sistema de arquivos

- Adição de checklists em dois modelos de API e discussão de prós e contras

    POST /tarefas e GET/PUT /tarefas/{id}

        Discutir sobre controle transacional/unit of work

    POST /tarefas/{id}/checklists
    GET /tarefas/{id}
    DELETE /tarefas/{id}/checklists/{id}
    POST /tarefas/{id}/checklists/{id}/tasks
    PUT/DELETE /tarefas/{id}/checklists/{id}/tasks/{id}

- Pool de conexões com Knex e as consequências disso com a questão da clusterização
