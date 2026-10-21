from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.aluno import Aluno
from app.models.prova import Prova
from app.models.prova_aluno import ProvaAluno
from app.schemas.prova_aluno import ProvaAlunoResponse, ProvaAlunoCreate

router = APIRouter()


@router.get("/prova-aluno", response_model=list[ProvaAlunoResponse])
def listar_provas_alunos(db: Session = Depends(get_db)):
    participacoes = db.query(ProvaAluno).all()

    return participacoes


@router.post(
    "/prova-aluno",
    response_model=ProvaAlunoResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_prova_aluno(
    dados: ProvaAlunoCreate,
    db: Session = Depends(get_db)
):

    aluno = db.query(Aluno).filter(
        Aluno.id_aluno == dados.aluno_id
    ).first()

    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {dados.aluno_id} não encontrado."
        )

    prova = db.query(Prova).filter(
        Prova.id_prova == dados.prova_id
    ).first()

    if not prova:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prova com ID {dados.prova_id} não encontrada."
        )

    nova_participacao = ProvaAluno(
        aluno_id=dados.aluno_id,
        prova_id=dados.prova_id
    )

    try:
        db.add(nova_participacao)
        db.commit()
        db.refresh(nova_participacao)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Aluno já está vinculado a esta prova."
        )

    return nova_participacao