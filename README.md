# GabaritAI

Sistema web para correção inteligente de cartões-resposta utilizando Visão Computacional e Inteligência Artificial, desenvolvido como projeto de portfólio e com potencial para uso em instituições de ensino.

## Objetivo

Automatizar a correção de provas objetivas através da comparação entre um gabarito oficial e os cartões-resposta dos alunos utilizando OpenCV.

## 🛠 Tecnologias

### Backend
- Python
- FastAPI
- SQLAlchemy
- MySQL

### Frontend
- HTML5
- CSS3
- Bootstrap 5
- JavaScript

### Visão Computacional
- OpenCV *(em implementação)*

### Gráficos
- Chart.js

## Funcionalidades do MVP

- Login
- Cadastro do gabarito
- Correção automática
- Ranking
- Dashboard

## 🏗 Arquitetura

Frontend (HTML, CSS, JavaScript)
        │
        ▼
 FastAPI (API REST)
        │
        ▼
      MySQL
        │
        ▼
 OpenCV (Correção das provas)

## 🐳 Executar com Docker

Requer Docker com Docker Compose. Na raiz do projeto, execute:

```bash
docker compose up --build
```

- Frontend: http://127.0.0.1:5500
- API: http://127.0.0.1:8000
- Documentação interativa da API: http://127.0.0.1:8000/docs

O Compose cria a imagem `gabaritai-api:latest`, inicia a API, serve o frontend
com Nginx e mantém os dados do MySQL no volume `mysql_data`. Para personalizar
as credenciais locais do banco, copie `.env.example` para `.env` antes de iniciar.
Os valores de exemplo são apenas para desenvolvimento; altere-os em qualquer
ambiente compartilhado ou de produção.

Na primeira inicialização, o MySQL executa `gabaritai.sql` automaticamente para
criar as tabelas. Esse processo só ocorre quando o volume do banco está vazio;
volumes já existentes são preservados e não recebem alterações automaticamente.
Para encerrar os serviços, execute `docker compose down`; os dados persistem no
volume. Para também removê-los e recriar o banco do zero, execute
`docker compose down -v` (isso apaga os dados armazenados).

### Correção automática por foto

O serviço `worker` lê as fotos dos cartões. Na tela **Respostas e correção**,
escolha **Automático**, envie a foto e confira as questões destacadas em
amarelo antes de registrar. Em caso de leitura errada, veja os logs com
`docker compose logs worker`.

## 📌 Status

**Versão atual:** MVP 0.1

### Sprint 1 ✅ Concluída

- [x] Estrutura do projeto
- [x] Configuração do ambiente
- [x] API inicial
- [x] Front-end inicial
- [x] Integração Front-end ↔ Back-end
- [x] Organização do Git com branch `develop`

### Próximas etapas

- [ ] Banco de dados
- [ ] Sistema de Login
- [ ] Cadastro de provas
- [ ] Dashboard
- [ ] Correção automática com OpenCV

## 👨‍💻 Autor

**Renan Albino Horne**

Projeto desenvolvido como portfólio de estudos em Desenvolvimento de Sistemas.