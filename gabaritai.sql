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

drop table questao;
