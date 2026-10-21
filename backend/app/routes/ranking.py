
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.prova import Prova
from app.services.ranking_service import gerar_ranking

router = APIRouter()

@router.get("/provas/{prova_id}/ranking")
def consultar_ranking(
    prova_id: int,
    turma: int | None = None,
    db: Session = Depends(get_db)
):
    #Verifica se a prova existe.
    prova = (
        db.query(Prova)
        .filter(Prova.id_prova == prova_id)
        .first()
    )
    
    if not prova:
        raise HTTPException(
            status_code=404,
            detail="Prova não econtrada."
        )
    
    #Gera o ranking da prova.
    ranking = gerar_ranking(db, prova_id)
    
    #Se uma turma foi informada, filtra o resultado
    if turma is not None:
        ranking["turmas"] = [
            resultado
            for resultado in ranking["turmas"]
            if resultado["turma"] == turma
        ]
        
        ranking["total_turmas"] = len(ranking["turmas"])
        
    return ranking