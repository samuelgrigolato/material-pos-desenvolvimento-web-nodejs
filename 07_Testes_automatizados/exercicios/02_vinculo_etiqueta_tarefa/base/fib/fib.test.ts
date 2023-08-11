import fib from './fib';

describe('fib', () => {

  it('should return 1 when n is 1', () => {
    expect(fib(1)).toBe(1);
  });

  it('should return 1 when n is 2', () => {
    expect(fib(2)).toBe(1);
  });

  it('should return 2 when n is 3', () => {
    expect(fib(3)).toBe(2);
  });

  it('should return 3 when n is 4', () => {
    expect(fib(4)).toBe(3);
  });

  it('should return 5 when n is 5', () => {
    expect(fib(5)).toBe(5);
  });

  it('should return 8 when n is 6', () => {
    expect(fib(6)).toBe(8);
  });

});
