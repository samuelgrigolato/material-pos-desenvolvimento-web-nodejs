'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db
    .createTable('usuarios', {
      id: { type: 'int', primaryKey: true },
      login: { type: 'string', length: 100, notNull: true, unique: true },
      senha: { type: 'blob', notNull: true }
    })
    .then(() => db.runSql('create sequence usuarios_id_seq;'));
};

exports.down = function(db) {
  return db
    .runSql('drop sequence usuarios_id_seq;')
    .then(() => db.dropTable('usuarios'));
};

exports._meta = {
  "version": 1
};
