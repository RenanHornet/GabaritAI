
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.correcao_service import corrigir_prova

router = APIRouter(
    prefix="/correcao",
    tags=["Correção"]
)


@router.get("/{prova_aluno_id}")
def corrigir(
    prova_aluno_id: int,
    db: Session = Depends(get_db)
):
    return corrigir_prova(
        db=db,
        prova_aluno_id=prova_aluno_id
    )
