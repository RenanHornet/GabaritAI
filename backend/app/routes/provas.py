from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.prova import Prova

router = APIRouter()

@router.get("/provas")
def listar_provas(db: Session = Depends(get_db)):
    provas = db.query(Prova).all()
    return provas