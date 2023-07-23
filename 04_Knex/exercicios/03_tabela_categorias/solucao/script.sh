
# primeiro a criação da migração
npx knex migrate:make cria_tabela_categorias

# depois da implementação, rodar a migração
npx knex migrate:latest
