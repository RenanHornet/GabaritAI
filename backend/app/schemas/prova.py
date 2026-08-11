from pydantic import BaseModel

class ProvaResponse(BaseModel):
    id_prova: int
    titulo: str
    descricao: str | None = None
    data_aplicacao: str | None = None
    quantidade_questoes: int 