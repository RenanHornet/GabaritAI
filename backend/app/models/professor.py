from sqlalchemy import Column, Integer, String
from app.database.base import Base

class Professor(Base):
    __tablename__ = "professor"

    id_cadastro = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True
    )
    nome = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    senha = Column(String(100), nullable=False)