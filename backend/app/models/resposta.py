from sqlalchemy import Column, Integer, ForeignKey, CHAR
from app.database.base import Base

class Resposta(Base):
    __tablename__ = "resposta"
    
    id_resposta = Column(
        Integer, 
        primary_key=True,
        autoincrement = True
    )
    
    prova_aluno_id = Column(
        Integer, 
        ForeignKey("prova_aluno.id_prova_aluno"),
        nullable=False
    )
    
    questao_id = Column(
        Integer,
        ForeignKey("questao.id_questao"),
        nullable=False
    )
    
    alternativa_marcada = Column(
        CHAR(1),
        nullable=False
    )