CREATE DATABASE IF NOT EXISTS gabaritai;
USE gabaritai;

CREATE TABLE IF NOT EXISTS professor (
    id_cadastro INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Professor de teste (somente desenvolvimento): o frontend usa professor_id = 1.
INSERT IGNORE INTO professor (id_cadastro, nome, email, senha) VALUES (
    1,
    'Teste',
    'teste@teste.com',
    '$argon2id$v=19$m=65536,t=3,p=4$V15nU/0lxqKGCacbGZyYlw$CZmshMY4u/NDkqN/PYTZzAapJ+kyIewYPeeamLOmvjE'
);

CREATE TABLE IF NOT EXISTS prova (
    id_prova INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    data_aplicacao DATE,
    professor_id INT NOT NULL,
    CONSTRAINT fk_prova_professor
        FOREIGN KEY (professor_id) REFERENCES professor(id_cadastro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS questao (
    id_questao INT AUTO_INCREMENT PRIMARY KEY,
    numero_questao INT NOT NULL,
    alternativa_correta CHAR(1) NOT NULL,
    prova_id INT NOT NULL,
    professor_id INT NOT NULL,
    CONSTRAINT fk_questao_prova
        FOREIGN KEY (prova_id) REFERENCES prova(id_prova),
    CONSTRAINT fk_questao_professor
        FOREIGN KEY (professor_id) REFERENCES professor(id_cadastro),
    CONSTRAINT uq_questao_prova_numero UNIQUE (prova_id, numero_questao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS aluno (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome_aluno VARCHAR(100) NOT NULL,
    turma INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prova_aluno (
    id_prova_aluno INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    prova_id INT NOT NULL,
    corrigida BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_aluno
        FOREIGN KEY (aluno_id) REFERENCES aluno(id_aluno),
    CONSTRAINT fk_prova
        FOREIGN KEY (prova_id) REFERENCES prova(id_prova),
    CONSTRAINT uq_aluno_prova UNIQUE (aluno_id, prova_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resposta (
    id_resposta INT AUTO_INCREMENT PRIMARY KEY,
    prova_aluno_id INT NOT NULL,
    questao_id INT NOT NULL,
    alternativa_marcada CHAR(1) NOT NULL,
    CONSTRAINT fk_resposta_prova_aluno
        FOREIGN KEY (prova_aluno_id) REFERENCES prova_aluno(id_prova_aluno),
    CONSTRAINT fk_resposta_questao
        FOREIGN KEY (questao_id) REFERENCES questao(id_questao),
    CONSTRAINT uq_resposta_prova_aluno_questao
        UNIQUE (prova_aluno_id, questao_id),
    CONSTRAINT chk_alternativa_marcada
        CHECK (alternativa_marcada IN ('A', 'B', 'C', 'D', 'E'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
