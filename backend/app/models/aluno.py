from sqlalchemy import Column, Integer, String
from app.database.base import Base

class Aluno(Base):
    __tablename__ = "aluno"

    id_aluno = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True
    )
    nome_aluno = Column(String(100), nullable=False)
    turma = Column(Integer, nullable=False)