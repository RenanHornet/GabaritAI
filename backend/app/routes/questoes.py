from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.questao import Questao
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

@router.post("/questoes", response_model=QuestaoResponse)
def criar_questao(questao: QuestaoCreate, db: Session = Depends(get_db)):
    nova_questao = Questao(**questao.model_dump())
    db.add(nova_questao)
    db.commit()
    db.refresh(nova_questao)
    return nova_questao

@router.put("/questoes/{id_questao}", response_model=QuestaoResponse)
def atualizar_questao(id_questao: int, questao: QuestaoCreate, db: Session = Depends(get_db)):
    questao_existente = db.query(Questao).filter(Questao.id_questao == id_questao).first()
    if not questao_existente:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    for key, value in questao.model_dump(exclude_unset=True).items():
        setattr(questao_existente, key, value)

    db.commit()
    db.refresh(questao_existente)
    return questao_existente

@router.delete("/questoes/{id_questao}")
def deletar_questao(id_questao: int, db: Session = Depends(get_db)):
    questao_existente = db.query(Questao).filter(Questao.id_questao == id_questao).first()
    if not questao_existente:
        raise HTTPException(status_code=404, detail="Questão não encontrada")

    db.delete(questao_existente)
    db.commit()
    return {"mensagem": "Questão deletada com sucesso"}

@router.get("/provas/{id_prova}/questoes", response_model=list[QuestaoResponse])
def listar_questoes_por_prova(id_prova: int, db: Session = Depends(get_db)):
    questoes = db.query(Questao).filter(Questao.prova_id == id_prova).all()

    return questoes