from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database.connection import get_db
from app.models.resposta import Resposta
from app.schemas.resposta import RespostaResponse, RespostaCreate
from app.models.prova_aluno import ProvaAluno
from app.models.questao import Questao
from app.models.prova import Prova
router = APIRouter()

@router.get("/respostas", response_model=list[RespostaResponse])
def listar_respostas(db: Session = Depends(get_db)):
    respostas = db.query(Resposta).all()
    return respostas

@router.post(
    "/respostas",
    response_model=RespostaResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_resposta(
    dados: RespostaCreate,
    db: Session = Depends(get_db)
):
    participacao = (
        db.query(ProvaAluno)
        .filter(ProvaAluno.id_prova_aluno == dados.prova_aluno_id)
        .first()
    )
    
    if not participacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participação do aluno na prova não encontrada."
        )
    
    questao_existente = (
        db.query(Questao)
        .filter(Questao.id_questao == dados.questao_id)
        .first()
    )
    
    if not questao_existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questão não encontrada."
        )
        
    if questao_existente.prova_id != participacao.prova_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A questão não pertence à prova em que o aluno está participando."
        )
    
    nova_resposta = Resposta(
        prova_aluno_id=dados.prova_aluno_id,
        questao_id=dados.questao_id,
        alternativa_marcada=dados.alternativa_marcada
    )
    try:
        db.add(nova_resposta)
        db.commit()
        db.refresh(nova_resposta)
        return nova_resposta
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta questão já possui uma resposta para esta participação na prova."
        ) 