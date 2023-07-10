# Proposta de exercício: exponha detalhes de uma tarefa

Implemente um endpoint para retornar detalhes de uma única tarefa, ele deve responder na rota `GET /tarefas/:id`. Faça com que este endpoint exija autenticação. Faça também com que ele dispare erro caso o usuário logado não seja dono da tarefa (mesmo que seja admin). Lembre-se: comece do model, depois desenvolva o endpoint.

Dica: se você definir um parâmetro de rota usando ":", ex: `/tarefas/:id`, o valor estará disponível no objeto `req.params`.
