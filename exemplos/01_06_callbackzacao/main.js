
function fetchComCallback(url, callback) {
  fetch(url)
    .then(resp => resp.json())
    .then(json => callback(undefined, json))
    .catch(err => callback(err));
}

fetchComCallback("https://viacep.com.br/ws/14820464/json/", function (err, resp) {
  if (err) console.error('ERRO', err);
  else console.log('SUCESSO', resp);
});
