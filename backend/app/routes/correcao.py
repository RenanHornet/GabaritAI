
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.professor import Professor
from app.models.prova import Prova
from app.models.prova_aluno import ProvaAluno
from app.core.dependencies import obter_professor_logado
from app.database.connection import get_db
from app.services.correcao_service import corrigir_prova

router = APIRouter(
    prefix="/correcao",
    tags=["Correção"]
)


@router.get("/{prova_aluno_id}")
def corrigir(
    prova_aluno_id: int,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    participacao = (
        db.query(ProvaAluno)
        .join(
            Prova,
            ProvaAluno.prova_id == Prova.id_prova
        )
        .filter(
            ProvaAluno.id_prova_aluno == prova_aluno_id,
            Prova.professor_id == professor.id_cadastro
        )
        .first()
    )
    
    if not participacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participação na prova não encontrada."
        )
    return corrigir_prova(
        db=db,
        prova_aluno_id=prova_aluno_id
    )
