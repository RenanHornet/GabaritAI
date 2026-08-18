from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.questao import Questao
from app.models.professor import Professor
from app.schemas.questao import QuestaoCreate, QuestaoResponse

router = APIRouter()

@router.get("/questoes", response_model=list[QuestaoResponse])
def listar_questoes(db: Session = Depends(get_db)):
    questoes = db.query(Questao).all()
    return questoes

@router.get("/questoes/{id_questao}", response_model=QuestaoResponse)
def buscar_questao(id_questao: int, db: Session = Depends(get_db)):
    questao = db.query(Questao).filter(Questao.id_questao == id_questao).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    return questao