from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth import autenticar_professor
from app.models.professor import Professor
from app.core.dependencies import obter_professor_logado

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(dados: LoginRequest, db: Session = Depends(get_db)):

    resultado = autenticar_professor(
        db,
        dados.email,
        dados.senha
    )

    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    return resultado

@router.get("/me")
def professor_atual(
    professor: Professor = Depends(obter_professor_logado)
):
    return {
        "professor_id": professor.id_cadastro,
        "nome": professor.nome,
        "email": professor.email
    }