# Prólogo

## Sobre o módulo e interação com front-end

O objetivo deste módulo é empoderar o aluno na utilização da plataforma Node.js para desenvolvimento de APIs back-end para aplicações web, mobile ou similar.

Isso é atingido seguindo as etapas abaixo:

1. Revisão/introdução ao desenvolvimento de aplicações web, focada na comunicação entre o navegador do usuário (front-end) e o servidor (back-end): HTML, CSS, JavaScript, Protocolo HTTP e requisições "AJAX" (usando Fetch API);

2. Análise das partes mais recorrentes em arquiteturas de back-end. Principais atributos e preocupações;

3. Posicionamento do Node.js como plataforma para desenvolvimento de APIs back-end. Motivos para usar ou não usar;

4. Apresentação do funcionamento interno do Node.js, além de uma revisão mais detalhada na linguagem JavaScript, fechando com um projeto prático envolvendo os módulos de clusterização e acesso a sistema de arquivos;

5. Apresentação da linguagem TypeScript, trazendo tipagem para o desenvolvimento;

6. Desenvolvimento de endpoints HTTP usando o framework Fastify;

7. Introdução às formas de comunicação com bases de dados relacionais, fechando com mais detalhes no uso da biblioteca Knex. Exemplos práticos dos principais cenários de modelagem de dados;

8. Evolução da API construída nas etapas anteriores, incluindo a adição de upload de anexos, autenticação usando JWT e integração com ChatGPT;

9. Introdução a testes automatizados com Jest.

Após este processo o aluno terá uma API robusta para servir de base no desenvolvimento front-end exercitado no módulo seguinte.

Todo o conteúdo é apresentado no formato "live coding", com pausas frequentes para estimular discussões, resolução de dúvidas e também para exercícios.

## Revisão/introdução ao desenvolvimento de aplicações web

Antes de focar nos detalhes do desenvolvimento back-end, é interessante entender exatamente o que significa essa palavra. Veja o exemplo abaixo de um trecho de funcionalidade possível para um aplicativo de aluguel de automóveis:

    [...]

    Mostrar uma lista de automóveis, com a principal foto, valor de venda, e descrição. Mostrar por padrão apenas os automóveis a até 50km de distância, mas permitir que o usuário selecione outro intervalo de distância através de um "slider".

    [...]

    Permitir que o usuário cadastre seus veículos usados. No formulário de cadastro deve ser solicitada uma foto, descrição e valor de venda.

    [...]

Imagine que esse texto veio acompanhado de vários desenhos, seja do cliente ou de um designer de produto, dando forma para a ideia. Seu papel, como desenvolvedor, é transformar isso em realidade. E agora?

O primeiro passo é confirmar se isso é realmente uma aplicação web (poderia ser uma rotina em segundo plano, ou uma aplicação desktop sem requisitos de rede). É evidente que se está falando de uma aqui, pois os usuários enviam e buscam informações conectados na rede, inclusive com a informação de um sendo apresentada para o outro (não há isolamento).

O segundo passo é identificar onde vão rodar os softwares dessa solução, ou, em outras palavras, onde estão os atores envolvidos? São eles:

- *Usuário*: acessando a aplicação em um navegador de Internet, este ator vai cadastrar os automóveis ou buscar ofertas perto da sua cidade. Este código executa no dispositivo (seja um celular, notebook etc) do próprio usuário;

- *Servidor*: recebe os cadastros, valida as informações, armazena-as em uma base resiliente, além de cuidar dos processos de cadastro, autenticação e autorização dos usuários. O código dos softwares de servidor executam em infraestrutura sob controle do dono da aplicação (seja na nuvem ou on-premises).

Com esses atores em mente é possível definir os tipos de desenvolvimento back-end e front-end, dessa maneira:

- Front-end: qualquer desenvolvimento voltado para executar no dispositivo do usuário, com o fim de mostrar/colher informações. Pode também ser interpretado como a parte "visual" da solução.

- Back-end: tudo que executa no servidor, para dar suporte aos requisitos da solução.

### Front-end: HTML, CSS e JavaScript

Direcionando o foco para o desenvolvimento front-end, sem dúvida a primeira tecnologia a se aprender é o HTML. Essa linguagem de marcação é o alicerce de qualquer aplicação web, antiga ou moderna. Veja o exemplo abaixo:

[Projeto 01_html_css_js](projetos/01_html_css_js/)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Próximo unicórnio, confia!</title>
</head>
<body>
  <p>Veja as ofertas abaixo:</p>
  <ul>
    <li>
      Carro X: R$ 100.000,00
      <button>
        Comprar
      </button>
    </li>
    <li>
      Carro Y: R$ 50.000,00
      <button>
        Comprar
      </button>
    </li>
  </ul>
</body>
</html>
```

Salvando o conteúdo em um arquivo qualquer com extensão `.html` e direcionando um navegador web até ele é possível ver uma página. Os detalhes para entender exatamente o que é possível fazer com HTML serão abordados no próximo módulo.

HTML não atua na estilização dos elementos, isso é papel de outra tecnologia, o CSS. Uma das maneiras de usar CSS é intejá-lo diretamente no código HTML, veja:

[Projeto 01_html_css_js](projetos/01_html_css_js/)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Próximo unicórnio, confia!</title>
  <style>

    ul {
      display: flex;
      flex-wrap: wrap;
      list-style-type: none;
      padding: 0;
    }

    li {
      flex: 1;
      background-color: #efefef;
      margin: 10px;
      padding: 20px;
      border-radius: 25px;
    }

    .botao-comprar {
      background-color: green;
      border: 0;
      font-weight: bold;
      color: white;
    }

  </style>
</head>
<body>
  <p>Veja as ofertas abaixo:</p>
  <ul>
    <li>
      Carro X: R$ 100.000,00
      <button class="botao-comprar">
        Comprar
      </button>
    </li>
    <li>
      Carro Y: R$ 50.000,00
      <button class="botao-comprar">
        Comprar
      </button>
    </li>
  </ul>
</body>
</html>
```

A terceira peça nesse quebra cabeça é o comportamento. Como reagir às ações do usuário na página? Por exemplo: como fazer com que o botão comprar só fique verde quando o mouse passar sobre ele? E como reagir ao clique no botão para solicitar que o usuário confirme a compra? Para isso existe o JavaScript. Note que ele também pode ser embutido nas páginas:

[Projeto 01_html_css_js](projetos/01_html_css_js/)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Próximo unicórnio, confia!</title>
  <style>

    ul {
      display: flex;
      flex-wrap: wrap;
      list-style-type: none;
      padding: 0;
    }

    li {
      flex: 1;
      background-color: #efefef;
      margin: 10px;
      padding: 20px;
      border-radius: 25px;
    }

    .botao-comprar {
      border: 0;
      background-color: #fefefe;
    }

    .botao-comprar.destacado {
      background-color: green;
      font-weight: bold;
      color: white;
    }

  </style>
</head>
<body>
  <p>Veja as ofertas abaixo:</p>
  <ul>
    <li>
      Carro X: R$ 100.000,00
      <button
        class="botao-comprar"
        onmouseenter="onMouseEnterBtnComprar(event)"
        onmouseleave="onMouseLeaveBtnComprar(event)"
        onclick="onClickBtnComprar('X')"
      >
        Comprar
      </button>
    </li>
    <li>
      Carro Y: R$ 50.000,00
      <button
        class="botao-comprar"
        onmouseenter="onMouseEnterBtnComprar(event)"
        onmouseleave="onMouseLeaveBtnComprar(event)"
        onclick="onClickBtnComprar('Y')"
      >
        Comprar
      </button>
    </li>
  </ul>
  <script>

    function onMouseEnterBtnComprar(event) {
      event.target.classList.add('destacado');
    }

    function onMouseLeaveBtnComprar(event) {
      event.target.classList.remove('destacado');
    }

    function onClickBtnComprar(carro) {
      if (confirm(`Confirma a compra do carro ${carro}?`)) {
        window.location = "https://www.google.com";
      }
    }

  </script>
</body>
</html>
```

Tanto CSS quanto JavaScript sendo usados no front-end são também escopo do próximo módulo, por isso não serão mais explorados aqui.

Com essas três peças trabalhando em conjunto é possível começar a discutir sobre o papel do Protocolo HTTP e o uso da Fetch API para conectar o back-end.

[Exercício 01_html_css_js](exercicios/01_html_css_js/README.md)

### Protocolo HTTP e Fetch API

Certamente os arquivos HTML das aplicações acessadas pelos usuários não estão em suas máquinas. Esse acesso ocorre através de requisições efetuadas usando o protocolo HTTP. Para entender como funciona esse protocolo será demonstrado o fluxo de requisições para apresentar a página inicial do Google.

Abra um navegador qualquer. Acesse suas ferramentas de desenvolvedor (normalmente acessível pela tecla F12). Vá até a aba de rede e então digite `google.com` na barra de endereços.

Uma lista bem grande aparece, onde cada item é uma *requisição HTTP*. Uma requisição feita para um servidor é composta dos seguintes atributos (considerando a seguinte URL de exemplo: `https://proximounicornio.com/ofertas?km=100`):

- Caminho: é a parte que fica depois do domínio da URL (no exemplo: `/ofertas?km=100`);

- Método ou verbo: é a ação pretendida com a requisição. Pode ser: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` e mais alguns outros tipos que não são relevantes nessa introdução. Desses verbos, o `GET` é o usado pelo navegador sempre que se digita um endereço direto na barra;

- Cabeçalhos de requisição: vários atributos no estilo chave e valor que permitem ao navegador configurar a requisição passando detalhes de autenticação, algoritmos de compressão, preferência de idioma do usuário dentro várias outras possibilidades.

Como o servidor é encontrado? A parte da esquerda do caminho não faz parte da requisição HTTP, pois ela é usada em uma etapa anterior, no estabelecimento da *conexão TCP* (ou UDP no caso de HTTP3/QUIC) com este. Isso ocorre extraindo as seguintes informações, necessárias para a abertura ou localização da conexão:

- Endereço IP do servidor: o domínio é passado para o serviço de DNS do dispositivo para obter um endereço IP;

- Porta: caso uma porta explícita tenha sido passada ela é utilizada (ex: `http://localhost:8080`), caso contrário a porta padrão do *protocolo da requisição* é usado. O protocolo é a parte que fica atrás do `://` no endereço completo, sendo o mais comum hoje (e recomendado para qualquer tipo de servidor exposto na Internet ou em redes inseguras) é o `https`, cuja porta padrão é a `443`. Para o protocolo `http` (sem a camada de segurança) a porta padrão é a porta `80`.

- Corpo: para requisições nos verbos `POST`, `PUT` e `PATCH` os dados informados pelo usuário vão no corpo da requisição. Normalmente usa-se o formato JSON, mas não é uma exigência do protocolo. O formato deve ser especificado no header `Content-Type` para instruir o servidor sobre a forma como deve processá-lo.

Com essas informações em mãos o navegador envia a requisição e fica aguardando uma *resposta*. Essa resposta, caso venha, possui os seguintes atributos:

- Código de status: número que indica o tipo de resposta. É sempre um número de 3 dígitos, sendo que o primeiro deles define a categoria macro da resposta. Principais categorias:

   * 2xx: deu tudo certo;
   * 3xx: a requisição pode ser atendida mas em outro endereço (redirecionamento);
   * 4xx: não foi possível atender pois a requisição tem informações inválidas;
   * 5xx: não foi possível atender pois o servidor está indisponível ou encontrou uma situação inesperada.

- Cabeçalhos de resposta: da mesma forma que os cabeçalhos de requisição, os cabeçalhos de resposta permitem que o servidor enriqueça com detalhes sobre o conteúdo. Alguns códigos de resposta, como os de redirecionamento (301 e 302) possuem cabeçalhos importantes, como o `Location` que indica para onde o navegador deve enviar a próxima requisição no redirecionamento.

- Corpo: dados de resposta, quando relevantes. Alguns códigos de status (como o `204 NO CONTENT`) indicam que não há corpo na resposta.

Com essas informações é possível terminar de analisar as requisições do Google.

É possível replicar isso na nossa página de exemplo de modo bem simples. Caso ainda não tenha, instale o pacote `http-server` usando o seguinte comando:

```
$ npm install -g http-server
```

Depois, em um terminal (pode ser o mesmo), navegue até o diretório onde criou o arquivo HTML e execute o seguinte comando:

```
$ http-server
```

Por fim abra o endereço `http://localhost:8080/seu-arquivo.html` no navegador e avalie o resultado da aba de rede do console de desenvolvedor.

Ao invés de retornar tudo em uma única requisição, é possível separar o CSS e JavaScript em outros. Faça isso criando os arquivos `estilo.css` e `main.js` abaixo e adaptando o arquivo HTML para injetá-los:

[Projeto 02_separando_css_js](projetos/02_separando_css_js/)

```css
ul {
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
}

li {
  flex: 1;
  background-color: #efefef;
  margin: 10px;
  padding: 20px;
  border-radius: 25px;
}

.botao-comprar {
  border: 0;
  background-color: #fefefe;
}

.botao-comprar.destacado {
  background-color: green;
  font-weight: bold;
  color: white;
}
```

```js
function onMouseEnterBtnComprar(event) {
  event.target.classList.add('destacado');
}

function onMouseLeaveBtnComprar(event) {
  event.target.classList.remove('destacado');
}

function onClickBtnComprar(carro) {
  if (confirm(`Confirma a compra do carro ${carro}?`)) {
    window.location = 'https://www.google.com';
  }
}
```

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Próximo unicórnio, confia!</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>
  <p>Veja as ofertas abaixo:</p>
  <ul>
    <li>
      Carro X: R$ 100.000,00
      <button
        class="botao-comprar"
        onmouseenter="onMouseEnterBtnComprar(event)"
        onmouseleave="onMouseLeaveBtnComprar(event)"
        onclick="onClickBtnComprar('X')"
      >
        Comprar
      </button>
    </li>
    <li>
      Carro Y: R$ 50.000,00
      <button
        class="botao-comprar"
        onmouseenter="onMouseEnterBtnComprar(event)"
        onmouseleave="onMouseLeaveBtnComprar(event)"
        onclick="onClickBtnComprar('Y')"
      >
        Comprar
      </button>
    </li>
  </ul>
  <script src="main.js"></script>
</body>
</html>
```

Analise agora novamente e verifique que o navegador está utilizando cache. Para evitar esse comportamento (note que fora do ambiente de desenvolvimento você não vai querer evitar isso, mas sim entender e usufruir dos benefícios) encerre o processo do `http-server` e execute-o novamente com o seguinte parâmetro:

```
$ http-server -c-1
```

Volte agora para a página do Google, limpe a aba de rede e comece a digitar na barra de pesquisa. Veja que a cada tecla uma requisição é efetuada, passando o termo digitado e recebendo uma resposta com os dados para a montagem da pré-visualização que apareceu sozinha. Essas requisições são o alicerce para todas as aplicações modernas, e boa parte do trabalho de back-end é desenvolver a outra ponta dessa chamada.

Para entender melhor essa dinâmica vamos implementar uma integração manualmente, utilizando uma das APIs mais comuns no front-end para este fim: a Fetch API. Acesse a seguinte URL (pode mudar o CEP conforme preferir) que hospeda um serviço aberto de consulta de informações de CEP: `https://viacep.com.br/ws/14820464/json/`.

Adicione agora no seu arquivo HTML criado anteriormente nessa seção uma seção com um campo texto, um botão e um span para mostrar o resultado:

[Projeto 03_exemplo_fetch](projetos/03_exemplo_fetch/)

```html
  </ul>
  <div>
    <input type="text" id="cep">
    <button onclick="buscarCep()">Buscar CEP</button>
    <span id="resultado"></span>
  </div>
  <script src="main.js"></script>
```

E o código JavaScript que implementa a integração no arquivo `main.js`:

```js
function buscarCep() {
  const cep = document.getElementById('cep').value;
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(function (resp) {
      return resp.json();
    })
    .then(function (dados) {
      document.getElementById('resultado').innerText = dados['logradouro'];
    })
    .catch(function (err) {
      document.getElementById('resultado').innerText = `Não foi possível carregar: ${err.message}`;
    });
}
```

Você obviamente vai querer implementar um tratamento de erro melhor na sua aplicação, tanto para ajudar o desenvolvedor (mostrando detalhes do erro no console) quanto o usuário (mostrando uma indicação mais amigável e instruções do que ele pode fazer dali para frente).

[Exercício 02_cambio](exercicios/02_cambio/README.md)

### Back-end: a outra ponta da requisição HTTP

Atenção! Agora é uma boa hora para garantir que o Node.js e o NPM estejam instalados. Execute `node -v` e `npm -v` no terminal e garanta que estão pelo menos na versão 18 e 8, respectivamente. Para instalar recomenda-se o uso do gestor de versões NVM: https://github.com/nvm-sh/nvm. Uma vez instalado baixe e use a versão latest:

```
$ nvm list
$ nvm ls-remote
$ nvm install lts/hydrogen
$ nvm use lts/hydrogen
```

Agora que está mais claro como o navegador envia as requisições HTTP, resta entender como o back-end as processa. Nesse ponto existe uma grande variação dependendo da linguagem e do _framework_ utilizados. Note que uma requisição HTTP, do ponto de vista do navegador, é unilateral, partindo sempre do navegador e recebendo uma única resposta do servidor. Existem várias técnicas que permitem solucionar requisitos diferentes, desde técnicas mais simples como `long pooling` até protocolos diferentes como Web Sockets.

Para entender como isso funciona na prática, vamos desenvolver um back-end usando o módulo `http` do Node.js, sem nenhuma outra dependência. Não foque nos detalhes do JavaScript neste momento, olharemos tudo isso com detalhes em breve.

Crie uma pasta vazia e, dentro dela, um arquivo chamado `app.js`. Neste arquivo escreva o seguinte conteúdo:

```js
const http = require('http');
const url = require('url');

const server = http.createServer(function (req, res) {
  const params = url.parse(req.url, true).query; // sem o true o atributo query é uma string
  const nome = params.nome;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(`Olá, ${nome}!`);
  res.end();
});

server.listen(8080);
```

Depois disso execute o servidor com o seguinte comando:

```
$ node app.js
```

Para testar é possível utilizar qualquer cliente HTTP, como o cUrl, HTTPie, Insomnia etc:

```
$ curl http://localhost:8080/\?nome\=Alguém
$ curl -v http://localhost:8080/\?nome\=Alguém
$ curl -G -v --data-urlencode "nome=Alguém"  http://localhost:8080/
$ http http://localhost:8080/\?nome\=Alguém
$ http -v http://localhost:8080/\?nome\=Alguém
```

Ou até mesmo o próprio navegador! Acesse `http://localhost:8080?nome=Alguém` e verifique.

Proposta de exercício: implementar um endpoint que faça o mesmo papel do endpoint do exercício anterior. Use dados fictícios e um conjunto pequeno de moedas. Dica: use o switch `--proxy http://localhost:8080` na chamada do `http-server`. Se você tentar chamar diretamente poderá enfrentar problemas de segurança (CORS, abordaremos isso em aulas futuras).

## Partes recorrentes e atributos de uma arquitetura de back-end

Agora que temos uma ideia de como ocorre o desenvolvimento back-end, podemos discutir os principais componentes desses projetos, e também os principais atributos que um desenvolvedor de back-end deve considerar na hora de avaliar a saúde do código.

Começando pelos componentes, podemos listar alguns: armazenamento de dados (sistema de arquivos, bases de dados dos mais diferentes paradigmas), balanceamento de carga, autenticadores, firewalls, serviços de cache, mensageria, agregadores de log e infraestrutura de rede.

Veja este link com uma arquitetura de referência AWS: https://labs.sogeti.com/aws-architecture-design-startup-use-case/. Este nível de conhecimento não é normalmente exigido do desenvolvedor back-end mas sim do profissional com perfil DevOps.

Com relação aos atributos, temos destaque para:

- Segurança: boa parte das APIs de back-end estão de uma forma ou de outra expostas publicamente (ou dentro de uma grande rede corporativa), e as soluções de front-end causam uma falsa impressão de segurança (ex: um botão desabilitado). Garantir que sua API é segura é uma tarefa contínua e árdua;

- Resiliência: a API está preparada para receber os picos de uso esperados para ela? Além disso, o quão protegida ela está contra ataques como DDoS ou fraudes por força-bruta? Cenários de indisponibilidade possuem raio de explosão controlado? Há degradação suave de funcionalidades? Os cenários de exceção são reportados para o consumidor da API com clareza e assertividade?

- Simplicidade: os consumidores da API conseguem encontrar rapidamente o ponto de integração ideal para o cenário que querem resolver? Os termos são condizentes com a expectativa do utilizador ou há muitas camadas de abstração atrapalhando a semântica? O consumidor envia e recebe apenas os dados realmente necessários para a operação que está executando?

- Observabilidade: a equipe que cuida da API em produção é imediatamente alertada sobre eventuais problemas? A taxa de falsos-positivos é suficientemente baixa de modo a evitar que o canal de alertas passe a ser ignorado? Os alertas possuem informação suficiente para um diagnóstico rápido e preciso? É possível encontrar features da API com pouca ou nenhuma utilização em determinados períodos de tempo, visando descontinuá-las? Essa gestão de código obsoleto é feita?

- Manutenabilidade: qualquer base de código-fonte que sirva de base para um software usado por um grande período de tempo deve possuir boa manutenabilidade, pois ele terá que ser alterado repetidamente durante todo seu ciclo de vida. Boas práticas de codificação que extrapolam o desenvolvimento back-end vão ajudar muito aqui. Falando especificamente de APIs, uma preocupação é a gestão de suporte a diferentes versões concorrentes de mesmas features, onde é necessário envolver todos os consumidores (internos ou externos), criar políticas de descontinuação e retrocompatibilidade, etc. Não importa a qualidade da feature, se ela vive quebrando ou acarretando em custo não previsto para seus consumidores, eles não vão querer mais utilizá-la.

- Corretude: a API é coerente nas respostas? Ou seja, se ela retornou uma resposta positiva, é seguro dizer que realmente aconteceu a operação? Esse nível de confiança é facilmente perdido e difícil de se recuperar.

## Node.js no back-end

Por que usar Node.js? Essa pergunta deve sempre ser revisitada, pois na área de tecnologia tudo muda muito rápido, e não seria diferente com recomendações de plataforma de desenvolvimento. Dito isso, alguns dos principais argumentos da atualidade a favor do uso de Node.js no back-end, são:

* Aumento na produtividade;
* Aumento na satisfação do desenvolvedor;
* Facilidade na hora de contratar;
* Estável;
* Uma ótima opção para o mundo serverless;
* Ecossistema de bibliotecas muito rico (até demais).

Mas e os pontos negativos?

* A arquitetura do event loop e o modelo de thread única pode confundir e dificultar a resolução de problemas que exigem muito paralelismo, principalmente se houver muita comunicação entre as partes;
* A grande quantidade de pacotes no ecossistema não significa que são todos pacotes de qualidade e mantidos, existe um processo de garimpo na escolha das suas dependências;
* A linguagem JavaScript é reconhecida pelas suas armadilhas, o que pode resultar em uma maior taxa de defeitos e/ou demora para estabilizar uma feature desenvolvida.
