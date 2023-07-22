# Proposta de exercício: adaptar o método "recuperarUsuarioAutenticado"

Adapte o método `recuperarUsuarioAutenticado` de modo que ele passe a consultar a informação do banco de dados.

Passos necessários:

1. criar uma tabela chamada `autenticacoes` com os campos `id` (do tipo `uuid`) e `id_usuario` (do tipo `int`, com uma chave estrangeira para a tabela de usuários);
2. inserir alguns registros para testes;
3. adaptar o método no model. Dica: você pode usar um join ou efetuar duas consultas separadas (uma para buscar o id do usuário e outra para buscar os dados do usuário).

## Notas da solução

O arquivo `script.sql` na pasta da solução deve ser executado primeiro.
