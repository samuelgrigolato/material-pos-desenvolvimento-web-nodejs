
class Main {
  public static void main(String[] args) {
    String msg = "Hello World!";
    int res = dobrar(5);
    String duplicada = duplicar(msg);
    System.out.println(duplicada + " " + res);
  }

  private static int dobrar(int x) {
    return x * 2;
  }

  private static String duplicar(String a) {
    return a + a;
  }
}
