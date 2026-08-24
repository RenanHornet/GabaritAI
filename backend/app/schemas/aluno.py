from pydantic import BaseModel

class AlunoResponse(BaseModel):
    id_aluno: int
    nome_aluno: str
    turma: int

class AlunoCreate(BaseModel):
    nome_aluno: str
    turma: int