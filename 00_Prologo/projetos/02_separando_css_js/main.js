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
