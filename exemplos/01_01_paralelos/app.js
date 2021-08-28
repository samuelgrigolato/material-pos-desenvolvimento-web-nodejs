
for (let i = 0; i < 5; i++) {
  setTimeout(function () {
    console.log(`i=${i}`);
  }, Math.random() * 1000);
}
