
function onMouseEnterBtnComprar(event) {
  event.target.className = "botao-comprar destacado";
}

function onMouseLeaveBtnComprar(event) {
  event.target.className = "botao-comprar";
}

function onClickBtnComprar(carro) {
  if (confirm(`Confirma a compra do carro ${carro}?`)) {
    window.location = "https://www.google.com";
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
      document.getElementById('resultado').innerText = `Não foi possível carregar: ${err.message}`;
    });
}
