from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.prova import Prova
from app.models.professor import Professor
from app.schemas.prova import ProvaCreate

router = APIRouter()

@router.get("/provas")
def listar_provas(db: Session = Depends(get_db)):
    provas = db.query(Prova).all()
    return provas

@router.post("/provas")
def criar_prova(prova: ProvaCreate, db: Session = Depends(get_db)):
    nova_prova = Prova(**prova.model_dump())
    db.add(nova_prova)
    db.commit()
    db.refresh(nova_prova)
    return nova_prova

@router.put("/provas/{id_prova}")
def atualizar_prova(id_prova: int, prova: ProvaCreate, db: Session = Depends(get_db)):
    prova_existente = db.query(Prova).filter(Prova.id_prova == id_prova).first()
    if not prova_existente:
        raise HTTPException(status_code=404, detail="Prova não encontrada")

    for key, value in prova.model_dump(exclude_unset=True).items():
        setattr(prova_existente, key, value)

    db.commit()
    db.refresh(prova_existente)
    return prova_existente