
async function dizerOi(i) {
  try {
    const resp = await fetch(`http://localhost:8080/?i=${i}`);
    if (resp.ok) {
      const text = await resp.text();
      console.log(`#${i}: tudo certo '${text}'`);
    } else {
      console.log(`#${i}: deu erro http ${resp.status}`);
    }
  } catch (err) {
    console.log(`#${i}: deu erro ${err.message}`);
  }
}

function main() {
  for (let i = 0; i < 10; i++) {
    dizerOi(i);
  }
}

main();
