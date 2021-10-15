import db from '../querybuilder';

export default (callback) => {
  return async () => {
    let trx = await db.transaction();
    try {
      await callback(trx);
    } finally {
      await trx.rollback();
    }
  }
};
