from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.aluno import Aluno
from app.models.prova import Prova
from app.models.prova_aluno import ProvaAluno
from app.models.professor import Professor
from app.schemas.prova_aluno import ProvaAlunoResponse, ProvaAlunoCreate
from app.core.dependencies import obter_professor_logado

router = APIRouter()


@router.get("/prova-aluno", response_model=list[ProvaAlunoResponse])
def listar_provas_alunos(
    db:Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    participacoes = db.query(ProvaAluno).join(
        Prova,
        ProvaAluno.prova_id == Prova.id_prova
    ).filter(
        Prova.professor_id == professor.id_cadastro
    ).all()
    
    return participacoes


@router.post(
    "/prova-aluno",
    response_model=ProvaAlunoResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_prova_aluno(
    dados: ProvaAlunoCreate,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    #Verifica se o aluno existe
    aluno = db.query(Aluno).filter(
        Aluno.id_aluno == dados.aluno_id
        
    ).first()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado."
        )
    
    #Verifica se a prova existe e pertence ao professor
    prova = db.query(Prova).filter(
        Prova.id_prova == dados.prova_id,
        Prova.professor_id == professor.id_cadastro
    ).first()   
    
    if not prova:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prova não encontrada."
        )
        
    #Cria a participação
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
            detail="Participação já existe."
        )
    
    return nova_participacao
    