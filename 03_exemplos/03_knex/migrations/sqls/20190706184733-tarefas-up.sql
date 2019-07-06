create sequence tarefas_id_seq;

create table tarefas (
  id int not null,
  usuario_id int not null,
  descricao varchar(100) not null,
  previsao timestamp not null,
  conclusao timestamp,

  constraint pk_tarefas primary key (id),
  constraint fk_tarefas_usuario foreign key (usuario_id) references usuarios (id)
);

create table etiquetas (
    id int not null,
    descricao varchar(100) not null,

    constraint pk_etiquetas primary key (id),
    constraint un_etiquetas_descricao unique (descricao)
);
insert into etiquetas (id, descricao) values (1, 'Casa'), (2, 'Trabalho');

create table tarefa_etiqueta (
    tarefa_id int not null,
    etiqueta_id int not null,

    constraint pk_tarefa_etiqueta primary key (tarefa_id, etiqueta_id),
    constraint fk_tarefa_etiqueta_tarefa
      foreign key (tarefa_id)
      references tarefas (id),
    constraint fk_tarefa_etiqueta_etiqueta
      foreign key (etiqueta_id)
      references etiquetas (id)
);
