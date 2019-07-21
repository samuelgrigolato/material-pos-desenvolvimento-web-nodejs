# Estudo de caso

Neste apêndice um cenário de implementação será proposto e discutido, cobrindo os seguintes aspectos:

- Desenvolvimento de solução inicial de forma monolítica e síncrona.
- Refatoração para uma arquitetura distribuída, incluindo um proxy reverso, ferramenta de service discovery, balanceamento de carga e *circuit breaker*.
- Discussão sobre controle transacional, e refatoração para adicionar mensageria na arquitetura.

O cenário que será implementado é o seguinte:

> Usuário solicita orçamento para compra de veículos, informando: marca, modelo, ano, quantidade desejada e e-mail de contato. Servidor busca o valor na tabela FIPE usando uma integração, aplica uma regra simples de cálculo de desconto baseada na quantidade, e envia um e-mail para o solicitante.

## A versão monolítica

Para começar, uma versão monolítica será implementada, e posteriormente quebrada em outros serviços (de forma parecida como ocorre na prática). Como a parte de front-end é bem simples, o middleware estático do próprio express será utilizado, ao invés de Angular.

Crie um novo projeto `npm` e instale o express e o pacote `express-formidable` (será usado para adicionar suporte a envio de dados no formato `multipart/form-data`):

```
npm init -y
npm i express express-formidable
```

Implemente uma API básica com os middlewares para JSON e arquivos estáticos, além de um endpoint que recebe os dados para efetivar a cotação, passando-os para um módulo de serviço:

```js
const express = require('express');
const formidable = require('express-formidable');
const cotacaoService = require('./cotacao/cotacao.service');


const app = express();


app.use(formidable());
app.use(express.static(`${__dirname}/public`));


app.post('/cotacao', async (req, res) => {
    try {
        await cotacaoService.cotar(req.fields);
        res.status(204).send();
    } catch (err) {
        console.log(err);
        if (err.dadosInvalidos) {
            res.status(400).send();
        } else {
            res.status(500).send();
        }
    }
});


app.listen(3000);
```

Crie o arquivo `cotacao/cotacao.service.js` mocando seu funcionamento por enquanto:

```js
module.exports.cotar = function (solicitacao) {
    return Promise.resolve();
};
```

Crie também um arquivo `public/index.html` com o seguinte código:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Cotações</title>
  </head>
  <body>
    <form onsubmit="event.preventDefault(); submeterCotacao(event.target);">
      <p>
        Marca:
        <input name="marca">
      </p>
      <p>
        Modelo:
        <input name="modelo">
      </p>
      <p>
        Ano:
        <input name="ano">
      </p>
      <p>
        Quantidade de veículos:
        <input name="quantidade" type="number">
      </p>
      <p>
        E-mail para retorno:
        <input name="email">
      </p>
      <p>
        <button>Cotar!</button>
      </p>
    </form>
    <script>

      function submeterCotacao(formElement) {
        const data = new FormData(formElement);
        fetch('/cotacao', {
          method: 'POST',
          body: data
        }).then(resp => {
          if (resp.status == 204) {
            alert('Sua cotação foi solicitada, verifique seu e-mail em alguns instantes!');
            formElement.reset();
          } else {
            alert('Não foi possível realizar a cotação!');
          }
        }).catch(err => {
          console.log(err);
          alert('Não foi possível realizar a cotação!');
        });
      }

    </script>
  </body>
</html>
```

Execute a API e acesse o endereço `http://localhost:3000` no navegador. Note que o formulário será apresentado e um retorno de sucesso aparecerá ao preenchê-lo e submeter a cotação.

O próximo passo é implementar de fato o processo de cotação, para isso será utilizada a seguinte API pública de obtenção de dados da tabela FIPE: https://deividfortuna.github.io/fipe/. O processo compreende três chamadas:

1. Obter o código da marca através do texto informado.
2. Obter o código do modelo através do texto informado.
3. Obter o valor de referência com base no código do modelo e no ano informado.

Para a implementação das chamadas, ao invés de usar diretamente o pacote `http` (nativo do Node), instale a biblioteca `request` (inspirada na biblioteca Python de mesmo nome):

```
npm i request
```

Altere o arquivo `cotacao.service.js` da seguinte forma para implementá-lo:

```js
const request = require('request');


module.exports.cotar = async function (solicitacao) {
    const idMarca = await buscarMarca(solicitacao.marca);
    const idModelo = await buscarModelo(idMarca, solicitacao.modelo);
    const valorFipe = await buscarValor(idMarca, idModelo, solicitacao.ano);
    const valor = calcularValor(valorFipe, solicitacao.quantidade);
    return enviarEmail(valor, solicitacao.email);
};


function buscarMarca(marca) {
    return new Promise((resolve, reject) => {
        request('https://parallelum.com.br/fipe/api/v1/carros/marcas', { json: true }, (err, _, body) => {
            if (err) {
                reject(err);
                return;
            }
            const registro = body.filter(x => x.nome.toLowerCase() == marca.toLowerCase())[0];
            if (registro) {
                resolve(registro.codigo);
            } else {
                reject({ dadosInvalidos: true, detalhes: 'Marca não encontrada' });
            }
        });
    });
}


function buscarModelo(idMarca, modelo) {
    return new Promise((resolve, reject) => {
        request(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${idMarca}/modelos`, { json: true }, (err, _, body) => {
            if (err) {
                reject(err);
                return;
            }
            const registro = body.modelos.filter(x => x.nome.toLowerCase() == modelo.toLowerCase())[0];
            if (registro) {
                resolve(registro.codigo);
            } else {
                reject({ dadosInvalidos: true, detalhes: 'Modelo não encontrado' });
            }
        });
    });
}


function buscarValor(idMarca, idModelo, ano) {
    return new Promise((resolve, reject) => {
        request(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${idMarca}/modelos/${idModelo}/anos/${ano}`, { json: true }, (err, resp, body) => {
            if (err) {
                reject(err);
                return;
            }
            if (resp.statusCode == 404) {
                reject({ dadosInvalidos: true, detalhes: 'Ano não encontrado' });
                return;
            }
            const valor = parseFloat(body.Valor
                .substring("R$ ".length)
                .replace('.', '')
                .replace(',', '.'));
            resolve(valor);
        });
    });
}


function calcularValor(valorFipe, quantidade) {
    // 1% por unidade, máximo de 5%
    return valorFipe * (1 - Math.min(0.05, (0.01 * quantidade)));
}


function enviarEmail(valor, email) {
    console.log(valor, email);
    return Promise.resolve();
}
```

Se desejar, Use os seguintes dados para testar:

- Marca: `Toyota`
- Modelo: `Hilux CD 4x4 2.8 Diesel Mec.`
- Ano: `2019-3`

O último passo é o envio do e-mail com o resultado da cotação. Instale a biblioteca `nodemailer` para isso, e use o serviço de teste SMTP `ethereal.email` que possui uma ótima integração com essa ferramenta:

```
npm i nodemailer
```

```js
const emailService = require('../email/email.service');
// ...
function enviarEmail(valor, email) {
    return emailService.enviar('Sua cotação foi processada',
        `Valor da cotação: ${valor}`, email);
}
```

```js
const nodemailer = require('nodemailer');


let _transporter;

async function getTransporter() {
    if (!_transporter) {
        const testAccount = await nodemailer.createTestAccount();
        _transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
        });
    }
    return _transporter;
}

module.exports.enviar = async function (assunto, texto, para) {
    const transporter = await getTransporter();
    let info = await transporter.sendMail({
        from: '"Equipe de Cotação" <contato@exemplo.com>',
        to: para,
        subject: assunto,
        text: texto
    });
    console.log("URL de pré-visualização: %s", nodemailer.getTestMessageUrl(info));
};
```

TODO:

- Estudo de caso com proxy rev (traefik), service discovery/lb (consul), circuit breaker (opossum)
    quebrar em três partes individualmente escaláveis
    discussão sobre timeouts (em cada camada)
    https://github.com/nodeshift/opossum
    nessa primeira versão chamar tudo de modo síncrono

    Mensageria, padrão saga e transações distribuídas
        quebrar a parte de envio de email em um componente que atua via rabbitmq/amqp
            https://medium.com/@programadriano/rabbitmq-criando-workers-com-node-js-268b40da7789
        consistência eventual
        orquestrador
        coreografia
