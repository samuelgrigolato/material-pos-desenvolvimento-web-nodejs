# Proposta de exercício: endpoints de suporte

Implemente os seguintes endpoints:

- `GET /etiquetas`: deve retornar as etiquetas existentes, da seguinte forma:

```json
[
  { "descricao": "casa", "cor": [ 255, 255, 255 ] },
  { "descricao": "trabalho", "cor": [ 50, 255, 50 ] }
]
```

- `GET /categorias`: deve retornar as categorias seguindo o formato de resposta abaixo:

```json
[
  { "id": 1, "descricao": "Urgente" },
  { "id": 2, "descricao": "Opcional" }
]
```

Crie routers específicos para cada endpoint, visto que são domínios diferentes.

Adapte os endpoints `GET /tarefas` e `GET /tarefas/:id` para retornar as etiquetas vinculadas com a tarefa.

Corrija por fim o endpoint `DELETE /tarefas/:id`, de modo que ele funcione corretamente para as tarefas que possuem vínculo com etiquetas (esses vínculos devem ser removidos). Dica: remova todos os possíveis vínculos de tarefa com etiqueta antes de executar o comando que remove a tarefa. Não se preocupe em excluir etiquetas que ficaram obsoletas desse modo.
