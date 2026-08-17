from fastapi import APIRouter, Depends
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