
create table autenticacoes (
  id uuid not null,
  id_usuario int not null,

  constraint pk_autenticacoes primary key (id),
  constraint fk_autenticacoes_usuario foreign key (id_usuario) references usuarios (id)
);
insert into autenticacoes (id, id_usuario) values ('a0b5902c-4f2d-429c-af40-38f00cddd3a6', 1);
