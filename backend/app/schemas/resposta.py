from pydantic import BaseModel
from typing import Literal

class RespostaResponse(BaseModel):
    id_resposta: int
    prova_aluno_id: int
    questao_id: int
    alternativa_marcada: Literal["A", "B", "C", "D", "E"]
    
class RespostaCreate(BaseModel):
    prova_aluno_id: int
    questao_id: int
    alternativa_marcada: Literal["A", "B", "C", "D", "E"]