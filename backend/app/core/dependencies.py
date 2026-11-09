from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError

from app.database.connection import get_db
from app.core.security import verificar_token
from app.models.professor import Professor


bearer_scheme = HTTPBearer(auto_error=False)


def obter_professor_logado(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não informado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        dados_token = verificar_token(credentials.credentials)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    professor_id = dados_token.get("sub")

    if not professor_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"}
        )

    professor = db.query(Professor).filter(
        Professor.id_cadastro == int(professor_id)
    ).first()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Professor não encontrado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return professor