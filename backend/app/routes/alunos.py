from fastapi import APIRouter, Depends, HTTPException  
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.aluno import Aluno
from app.schemas.aluno import AlunoCreate, AlunoResponse

router = APIRouter()
@router.get("/alunos", response_model=list[AlunoResponse])
def listar_alunos(db: Session = Depends(get_db)):
    alunos = db.query(Aluno).all()
    return alunos

@router.post("/alunos", response_model=AlunoResponse)
def criar_aluno(aluno: AlunoCreate, db: Session = Depends(get_db)):
    novo_aluno = Aluno(**aluno.model_dump())
    db.add(novo_aluno)
    db.commit()
    db.refresh(novo_aluno)
    return novo_aluno

@router.put("/alunos/{id_aluno}", response_model=AlunoResponse)
def atualizar_aluno(id_aluno: int, aluno: AlunoCreate, db: Session = Depends(get_db)):
    aluno_existente = db.query(Aluno).filter(Aluno.id_aluno == id_aluno).first()
    if not aluno_existente:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    for key, value in aluno.model_dump().items():
        setattr(aluno_existente, key, value)
    db.commit()
    db.refresh(aluno_existente)
    return aluno_existente

@router.delete("/alunos/{id_aluno}")
def deletar_aluno(id_aluno: int, db: Session = Depends(get_db)):    
    aluno_existente = db.query(Aluno).filter(Aluno.id_aluno == id_aluno).first()
    if not aluno_existente:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    db.delete(aluno_existente)
    db.commit()
    return {"mensagem": "Aluno deletado com sucesso"}