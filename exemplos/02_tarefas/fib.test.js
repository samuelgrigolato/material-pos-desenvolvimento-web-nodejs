import fib from './fib';

describe('fib', () => {
  it ('deve retornar 1 para n=1', () => {
    expect(fib(1)).toBe(1);
  });

  it ('deve retornar 1 para n=2', () => {
    expect(fib(2)).toBe(1);
  });

  it ('deve retornar 2 para n=3', () => {
    expect(fib(3)).toBe(2);
  });

  it ('deve retornar 3 para n=4', () => {
    expect(fib(4)).toBe(3);
  });

  it ('deve retornar 5 para n=5', () => {
    expect(fib(5)).toBe(5);
  });

  it ('deve retornar 8 para n=6', () => {
    expect(fib(6)).toBe(8);
  });
});

export default {};
