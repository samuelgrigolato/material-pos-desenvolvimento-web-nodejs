function imprimir(obj: string[] | string): void {
  if (typeof obj === 'string') {
    console.log(obj);
  } else {
    for (const x of obj) {
      console.log(x);
    }
  }
}

imprimir(['abc', 'def']);
imprimir('ghi');
