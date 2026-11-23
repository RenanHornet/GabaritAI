from sqlalchemy.orm import Session

from app.models.professor import Professor
from app.core.security import verificar_senha, criar_token_acesso


def autenticar_professor(db: Session, email: str, senha: str):
    professor = db.query(Professor).filter(
        Professor.email == email
    ).first()

    if not professor:
        return None

    senha_valida = verificar_senha(senha, professor.senha)

    if not senha_valida:
        return None

    token = criar_token_acesso({
        "sub": str(professor.id_cadastro)
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "professor_id": professor.id_cadastro,
        "nome": professor.nome
    }