# Proposta de exercício: modo admin

Adicione uma propriedade chamada `admin`, do tipo booleana, nos registros de usuário.

Se o usuário autenticado for um admin, ele pode consultar todas as tarefas, não somente as dele. Nada muda no endpoint de cadastro de tarefa.

Dica: refatore a função `recuperarLoginDoUsuarioAutenticado`, construindo em seu lugar uma função chamada `recuperarUsuarioAutenticado`. Assim você consegue disponibilizar na requisição todos os dados do usuário, não apenas o login.
