from pydantic import BaseModel

class ProvaResponse(BaseModel):
    id_prova: int
    titulo: str
    descricao: str | None = None
    data_aplicacao: str | None = None
    professor_id: int
    
class ProvaCreate(BaseModel):
    titulo:str
    descricao: str | None = None
    data_aplicacao: str | None = None
    professor_id: int