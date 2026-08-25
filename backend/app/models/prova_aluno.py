from sqlalchemy import Column, ForeignKey, Integer
from app.database.base import Base

class ProvaAluno(Base):
    __tablename__ = "prova_aluno"

    id_prova_aluno = Column(
        Integer,
        primary_key=True, 
        autoincrement=True
    )
    aluno_id = Column(
        Integer, 
        ForeignKey("aluno.id_aluno"), 
        nullable=False
    )
    
    prova_id = Column(
        Integer, 
        ForeignKey("prova.id_prova"), 
        nullable=False
    )