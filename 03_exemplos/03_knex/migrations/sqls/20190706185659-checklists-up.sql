create table checklists (
    id uuid not null,
    tarefa_id int not null,
    descricao varchar(100) not null,

    constraint pk_checklists primary key (id),
    constraint fk_checklists_tarefa foreign key (tarefa_id) references tarefas (id)
);

create table items_checklist (
    id uuid not null,
    checklist_id uuid not null,
    descricao varchar(100) not null,
    completado boolean default false,

    constraint pk_items_checklist primary key (id),
    constraint fk_items_checklist_checklist
      foreign key (checklist_id)
      references checklists (id)
);
