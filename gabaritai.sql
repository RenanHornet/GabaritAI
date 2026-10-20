create database if not exists gabaritai;
use gabaritai;
show tables;
describe questao;


create table professor (
	id_cadastro int(10) auto_increment primary key, 
    nome varchar(255) not null, 
    email varchar(255) not null unique, 
    senha varchar(100) not null
    
);

select * from prova;

create table prova (
	id_prova int(10) auto_increment primary key,
    titulo varchar(100) not null,
    descricao varchar(255),
    data_aplicacao date, 
    professor_id int not null,
    constraint fk_prova_professor
		foreign key(professor_id)
        references professor(id_cadastro)
);

create table questao (
	id_questao int auto_increment primary key, 
    numero_questao int not null,
    alternativa_correta char(1) not null,
    prova_id int not null, 
    professor_id int not null, 
    constraint fk_questao_prova foreign key (prova_id) references prova(id_prova),
    constraint fk_questao_professor foreign key (professor_id) references professor (id_cadastro),
    constraint uq_questao_prova_numero unique (prova_id, numero_questao)
);

create table aluno (
	id_aluno int auto_increment primary key, 
    nome_aluno varchar(100) not null, 
    turma int(2)  not null
);

create table prova_aluno(
	id_prova_aluno int auto_increment primary key,
    aluno_id int not null,
    prova_id int not null,
    constraint fk_aluno foreign key (aluno_id) references aluno (id_aluno),
    constraint fk_prova foreign key(prova_id) references prova(id_prova),
    constraint uq_aluno_prova unique (aluno_id, prova_id)
);

alter table prova_aluno
add column corrigida boolean not null default false;

create table resposta (
    id_resposta int auto_increment primary key,
    prova_aluno_id int not null, 
    questao_id int not null, 
    alternativa_marcada char(1) not null,

    constraint fk_resposta_prova_aluno foreign key (prova_aluno_id) references prova_aluno(id_prova_aluno),

    constraint fk_resposta_questao foreign key (questao_id) references questao(id_questao),

    constraint uq_resposta_prova_aluno_questao unique (prova_aluno_id, questao_id),

    constraint chk_alternativa_marcada check (alternativa_marcada in ('A', 'B', 'C', 'D', 'E'))
);

select * from prova_aluno;