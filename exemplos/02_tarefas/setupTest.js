import db from './querybuilder';

afterAll(async () => {
  await db.destroy();
});
