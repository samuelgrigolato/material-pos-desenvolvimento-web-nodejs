# Proposta de exercício: concluindo e reabrindo

Implemente o endpoint `POST /tarefas/:id/reabrir`. Lembre-se da idempotência, e do fato de reabrir significar nada mais que atribuir `null` para `dataDeConclusao`. O que acontece com o histórico? Um bom momento para discutir Event Sourcing.
