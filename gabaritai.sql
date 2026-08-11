create database gabaritai;

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
    prova_id int not null, 
    numero int not null, 
    alternativa_correta char(1) not null,
    constraint fk_questao_prova
		foreign key (prova_id)
        references prova(id_prova)
);

insert into prova (titulo, descricao, data_aplicacao, professor_id) 
values ("prova semestral", "prova avaliativa de final de semestre", 2025-11-30, 1);

insert into professor (nome, email, senha) 
values ("Roberval", "roberval@email.com", "123456");