from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.questao import Questao
from app.models.professor import Professor
from app.models.prova import Prova
from app.schemas.questao import QuestaoCreate, QuestaoResponse
from app.core.dependencies import obter_professor_logado

router = APIRouter()

@router.get("/questoes", response_model=list[QuestaoResponse])
def listar_questoes(
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    questoes = db.query(Questao).filter(
        Questao.professor_id == professor.id_cadastro
    ).all()

    return questoes

@router.get("/questoes/{id_questao}", response_model=QuestaoResponse)
def buscar_questao(
    id_questao: int,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    questao = db.query(Questao).filter(
        Questao.id_questao == id_questao,
        Questao.professor_id == professor.id_cadastro
    ).first()
    if not questao:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    return questao

@router.post("/questoes", response_model=QuestaoResponse)
def criar_questao(
    questao: QuestaoCreate,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    prova_existente = db.query(Prova).filter(
        Prova.id_prova == questao.prova_id,
        Prova.professor_id == professor.id_cadastro
    ).first()

    if not prova_existente:
        raise HTTPException(
            status_code=404,
            detail="Prova não encontrada"
        )

    nova_questao = Questao(
        numero_questao=questao.numero_questao,
        alternativa_correta=questao.alternativa_correta,
        prova_id=questao.prova_id,
        professor_id=professor.id_cadastro
    )

    db.add(nova_questao)
    db.commit()
    db.refresh(nova_questao)

    return nova_questao


@router.put("/questoes/{id_questao}", response_model=QuestaoResponse)
def atualizar_questao(
    id_questao: int,
    questao: QuestaoCreate,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    # Verifica se a questão pertence ao professor
    questao_existente = db.query(Questao).filter(
        Questao.id_questao == id_questao,
        Questao.professor_id == professor.id_cadastro
    ).first()

    if not questao_existente:
        raise HTTPException(
            status_code=404,
            detail="Questão não encontrada"
        )

    # Verifica se a prova de destino pertence ao professor
    prova_existente = db.query(Prova).filter(
        Prova.id_prova == questao.prova_id,
        Prova.professor_id == professor.id_cadastro
    ).first()

    if not prova_existente:
        raise HTTPException(
            status_code=404,
            detail="Prova não encontrada"
        )

    # Atualiza os dados da questão
    for key, value in questao.model_dump(exclude_unset=True).items():
        setattr(questao_existente, key, value)

    db.commit()
    db.refresh(questao_existente)

    return questao_existente


@router.delete("/questoes/{id_questao}")
def deletar_questao(
    id_questao: int,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    questao_existente = db.query(Questao).filter(
        Questao.id_questao == id_questao,
        Questao.professor_id == professor.id_cadastro
    ).first()
    if not questao_existente:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    db.delete(questao_existente)
    db.commit()
    return {"mensagem": "Questão deletada com sucesso"}

@router.get("/provas/{id_prova}/questoes", response_model=list[QuestaoResponse])
def listar_questoes_por_prova(
    id_prova: int,
    db: Session = Depends(get_db),
    professor: Professor = Depends(obter_professor_logado)
):
    prova_existente = db.query(Prova).filter(
        Prova.id_prova == id_prova,
        Prova.professor_id == professor.id_cadastro
    ).first()

    if not prova_existente:
        raise HTTPException(
            status_code=404,
            detail="Prova não encontrada"
        )

    questoes = db.query(Questao).filter(
        Questao.prova_id == id_prova
    ).all()

    return questoes