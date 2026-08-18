from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.base import Base

class Questao(Base):
    __tablename__ = "questao"

    id_questao = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True
    )
    numero_questao = Column(Integer, nullable=False)
    alternativa_correta = Column(String(1), nullable=False)
    prova_id = Column(
        Integer, 
        ForeignKey("prova.id_prova"), 
        nullable=False
    )
    professor_id = Column(
        Integer, 
        ForeignKey("professor.id_cadastro"), 
        nullable=False
)
    