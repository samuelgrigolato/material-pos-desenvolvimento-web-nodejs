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
