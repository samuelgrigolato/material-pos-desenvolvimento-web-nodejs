# Cache

O que é Cache? De acordo com a Wikipedia:

> Na área da computação, cache é um dispositivo de acesso rápido, interno a um sistema, que serve de intermediário entre um operador de um processo e o dispositivo de armazenamento ao qual esse operador acede. A principal vantagem na utilização de um cache consiste em evitar o acesso ao dispositivo de armazenamento - que pode ser demorado -, armazenando os dados em meios de acesso mais rápidos.

No âmbito de uma aplicação web, esse conceito pode ser aplicado em várias etapas, as quais serão discutidas individualmente neste material. São elas:

- Armazenamento em memória client-side do navegador do usuário.
- Uso de cabeçalhos de manipulação de cache suportados pela própria especificação HTTP. Este pode ser entendido como cache HTTP client-side.
- Ainda na camada HTTP, mas no lado do servidor, através do uso de bibliotecas back-end para este fim.
- Na camada de modelo (ou qualquer outra camada do back-end), através do uso de *memoização*.

## Memória client-side (navegador)

Imagine que sua aplicação tenha um processamento considerável para mostrar uma lista de informações na página inicial. Não há a necessidade de atualizar esses dados a cada vez que o usuário acessa essa tela, logo uma estratégia de cache pode poupar muitos recursos dos seus servidores. A biblioteca `rxjs` oferece uma ótima API para isso, baseada no uso da classe `ReplaySubject` (opcionalmente através do método fábrica `shareReplay`).

Para implementar um exemplo dessa estratégia, comece criando uma simples API que retorna uma lista de nomes depois de 3 segundos (simulando um processamento pesado). Inicie um projeto npm e adicione o express nele:

```
npm init
npm i express cors
```

Implemente agora o arquivo `index.js`:

```js
const express = require('express');
const cors = require('cors');


const app = express();


app.use(cors());


app.get('/nomes', (_, res) => {
    setTimeout(() => {
        res.send([ 'Pessoa 1', 'Pessoa 2', 'Pessoa 3' ]);
    }, 3000);
});


app.listen(3000);
```

Crie agora um projeto Angular em outro diretório (lembre-se de optar pela adição do módulo de roteamento):

```
ng new
```

Navegue até o diretório do projeto e gere dois componentes que farão o papel de páginas:

```
ng generate component home
ng generate component outra-pagina
```

Gere também um serviço que encapsulará a chamada para a API de nomes:

```
ng generate service nomes
```

Edite o arquivo `app.component.html` deixando apenas a tag `router-outlet`:

```html
<router-outlet></router-outlet>
```

Edite o arquivo `app-routing.module.ts` configurando as rotas para os componentes correspondentes:

```ts
// ...

import { HomeComponent } from './home/home.component';
import { OutraPaginaComponent } from './outra-pagina/outra-pagina.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'outra',
    component: OutraPaginaComponent
  }
];

// ...
```

Edite agora o arquivo `home.component.html`, adicionando link para a outra página e mostrando a lista de nomes:

```html
<p *ngIf="!nomes">Carregando...</p>
<ul *ngIf="nomes">
  <li *ngFor="let nome of nomes">{{nome}}</li>
</ul>

<p>
  <a [routerLink]="['/outra']">Ir para a outra página</a>
</p>
```

E também o arquivo `home.component.ts`, para carregar a lista de nomes:

```ts
import { Component, OnInit } from '@angular/core';

import { NomesService } from '../nomes.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  nomes: string[];

  constructor(private nomesService: NomesService) { }

  ngOnInit() {
    this.nomesService
      .getNomes()
      .subscribe(nomes => this.nomes = nomes);
  }

}
```

Registre o módulo `HttpClient` no arquivo `app.module.ts` e implemente o método `getNomes` no arquivo `nomes.service.ts`:

```ts
// ...
import { HttpClientModule } from '@angular/common/http';
// ...

@NgModule({
  // ...
  imports: [
    // ....
    HttpClientModule
  ],
  // ...
})
export class AppModule { }
```

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NomesService {

  constructor(private http: HttpClient) { }

  getNomes(): Observable<string[]> {
    return <Observable<string[]>>this.http
      .get('http://localhost:3000/nomes');
  }

}
```

Por fim adicione um link na página `outra-pagina.component.html` para retornar à página inicial:

```html
<p>outra-pagina works!</p>

<p>
  <a [routerLink]="['/']">Retornar à página inicial.</a>
</p>
```

Teste a aplicação deixando a API no ar e executando `ng serve`. Note que a cada retorno na página inicial são mais 3s de espera. Veja como é fácil resolver essa questão usando cache no serviço `NomesService`:

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NomesService {

  private nomes: Observable<string[]>;

  constructor(private http: HttpClient) { }

  getNomes(): Observable<string[]> {
    if (!this.nomes) {
      this.nomes = <Observable<string[]>>this.http
        .get('http://localhost:3000/nomes')
        .pipe(shareReplay(1));
    }
    return this.nomes;
  }

}
```

Para adicionar um tempo de vida para este cache, por exemplo 10 segundos, basta usar um `setTimeout`, limpando a propriedade `nomes`:

```ts
// ...
export class NomesService {

  // ...

  getNomes(): Observable<string[]> {
    if (!this.nomes) {
      this.nomes = <Observable<string[]>>this.http
        .get('http://localhost:3000/nomes')
        .pipe(shareReplay(1));
      setTimeout(() => {
        this.nomes = null;
      }, 10000);
    }
    return this.nomes;
  }

}
```

## Cabeçalhos HTTP (também client-side)

TODO:

- O que é
- Camadas de cache em uma aplicação web
    - Memoização (camada de modelo)
        fazer na mão
        usar https://github.com/medikoo/memoizee#readme
    - HTTP server side
        fazer um próprio
        usar https://www.npmjs.com/package/apicache
    - HTTP client side (headers)
        útil para arquivos estáticos, mas também pode ser um inferno pra lidar
