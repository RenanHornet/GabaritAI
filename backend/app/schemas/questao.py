from typing import Literal
from pydantic import BaseModel, Field

class QuestaoResponse(BaseModel):
    id_questao: int
    numero_questao: int
    alternativa_correta: str
    prova_id: int
    professor_id: int

class QuestaoCreate(BaseModel):
    numero_questao: int = Field(gt=0)
    alternativa_correta: Literal["A", "B", "C", "D", "E"]
    prova_id: int
    professor_id: int