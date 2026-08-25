from pydantic import BaseModel

class ProvaAlunoResponse (BaseModel):
    id_prova_aluno: int
    aluno_id: int
    prova_id: int

class ProvaAlunoCreate(BaseModel):
    aluno_id: int
    prova_id: int