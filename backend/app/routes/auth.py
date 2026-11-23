from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth import LoginRequest, LoginResponse, ProfessorCreate
from app.services.auth import autenticar_professor
from app.models.professor import Professor
from app.core.dependencies import obter_professor_logado
from app.core.security import hash_senha

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

@router.post("/professores", status_code=status.HTTP_201_CREATED)
def cadastrar_professor(
    dados: ProfessorCreate,
    db: Session = Depends(get_db)
):
    #verifica se o email já está cadastrado
    professor_existente = db.query(Professor).filter(
        Professor.email == dados.email
    ).first()
    
    if professor_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado"
        )
    
    #Cria um novo professor
    novo_professor = Professor(
        nome=dados.nome,
        email=dados.email,
        senha=hash_senha(dados.senha)
    )
    
    db.add(novo_professor)
    db.commit()
    db.refresh(novo_professor)
    
    return{
        "mensagem": "Professor cadastrado com sucesso",
        "professor_id": novo_professor.id_cadastro,
        "nome": novo_professor.nome,
        "email": novo_professor.email
    }

@router.get("/me")
def professor_atual(
    professor: Professor = Depends(obter_professor_logado)
):
    return {
        "professor_id": professor.id_cadastro,
        "nome": professor.nome,
        "email": professor.email
    }