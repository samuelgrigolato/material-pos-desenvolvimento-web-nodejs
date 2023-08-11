import knex from './shared/querybuilder';


afterAll(async () => {
  await knex.destroy();
});
