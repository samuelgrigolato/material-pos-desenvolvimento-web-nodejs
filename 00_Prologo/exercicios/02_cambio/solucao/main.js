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
      console.error(err);
      document.getElementById('resultado').innerText = `Não foi possível carregar: ${err.message}`;
    });
}

function buscarCotacoes() {
  const resultado = document.getElementById('resultado-cotacoes');
  const tbody = document.getElementById('cotacoes');

  resultado.innerHTML = '...';
  tbody.innerHTML = '';

  const moeda = document.getElementById('moeda').value;
  fetch(`https://open.er-api.com/v6/latest/${moeda}`)
    .then(function (resp) {
      return resp.json();
    })
    .then(function (dados) {
      if (dados['result'] === 'error') {
        console.error(dados);
        resultado.innerText = `Não foi possível carregar as cotações: ${dados['error-type']}`;
        return;
      }
      const cotacoes = dados['rates'];
      resultado.innerText = `Foram encontradas ${Object.keys(cotacoes).length} cotação(ões).`;
      for (const moeda in cotacoes) {
        const tr = document.createElement('tr');
        const tdMoeda = document.createElement('td');
        tdMoeda.innerText = moeda;
        tr.appendChild(tdMoeda);
        const tdValor = document.createElement('td');
        tdValor.innerText = cotacoes[moeda];
        tr.appendChild(tdValor);
        tbody.appendChild(tr);
      }
    })
    .catch(function (err) {
      console.error(err);
      resultado.innerText = `Não foi possível carregar as cotações: ${err.message}`;
    });
}
